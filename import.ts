import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import csv from 'csv-parser';
import { Readable } from 'stream';

const prisma = new PrismaClient();

async function importKCDData() {
  try {
    const filePath = '//';
    
    // EUC-KR 인코딩으로 파일 읽기
    const buffer = fs.readFileSync(filePath);
    const csvContent = iconv.decode(buffer, 'euc-kr');
    
    // key 설정 (TKCD8 데이터 미리 로드)
    const tkcd8Map = new Map();
    const allTkcd8 = await prisma.tKCD8.findMany();
    allTkcd8.forEach(item => {
      const key = `${item.KCDCODE}---${item.KCDNAME_KR}---${item.KCDNAME_EN}`;
      if(!tkcd8Map.has(key)) {
        tkcd8Map.set(key, []);
      }
      tkcd8Map.get(key).push(item);
    });

    const batchData = [];
    const results: any = [];

    // CSV 파싱을 위한 스트림 생성
    const stream = Readable.from([csvContent]);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({
          headers: ['상병기호', '한글명', '영문명', '완전코드구분', '주상병사용구분', '법정감염병구분', '성별구분', '상한연령', '하한연령', '양한방구분']
        }))
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // 데이터 처리
    for (let i = 1; i < results.length; i++) {
      const row = results[i];
      
      const kcdcode = row['상병기호'];
      const kcdname_kr = row['한글명'];
      const kcdname_en = row['영문명'];
      const incomlete = row['완전코드구분'];
      const maindisease = row['주상병사용구분'];
      const infect = row['법정감염병구분'];
      const gender = row['성별구분'];
      const age1 = row['상한연령'];
      const age2 = row['하한연령'];
      const dtype = row['양한방구분'];

      try {
        const key = `${kcdcode}---${kcdname_kr}---${kcdname_en}`;
        const tkcd8Array = tkcd8Map.get(key) || [];

        batchData.push({
          KCDCODE: kcdcode ? String(kcdcode).trim() : '',
          KCDNAME_KR: kcdname_kr ? String(kcdname_kr).trim() : '',   
          KCDNAME_EN: kcdname_en ? String(kcdname_en).trim() : '',    
          INFECT: infect ? String(infect).trim() : '',      
          GENDER: gender ? String(gender).trim() : '',       
          AGE1: age1 ? (age1.trim() ? Number(age1) : 0) : 0,  
          AGE2: age2 ? (age2.trim() ? Number(age2) : 0) : 0,  
          INCOMLETE: incomlete === 'N' ? 2 : 0, 
          MT028: tkcd8Array[0]?.MT028 || 0,
          DTYPE: dtype ? String(dtype).trim() : '',
          MAINDISEASE: maindisease ? String(maindisease).trim() : '',
          CHUNACHECK: tkcd8Array[0]?.CHUNACHECK || 0,
        });

      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        console.log('Row data:', row);
      }
    }

    console.log(`Inserting ${batchData.length} records...`);

    await prisma.tKCD9.createMany({
      data: batchData
    });

    console.log(`✅ Import completed! Total records imported: ${batchData.length}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importKCDData();