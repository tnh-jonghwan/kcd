# KCD 9th Edition Update (kcd9차 상병업데이트)

이 프로젝트는 KCD 9차 상병 업데이트를 위한 데이터를 데이터베이스(MySQL)에 임포트하는 코드입니다.

## 사전 준비

1. `.env` 파일에 데이터베이스 연결 정보를 설정합니다.
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   ```

## 실행 순서

아래 명령어를 순서대로 실행하여 데이터를 처리합니다.

1. **Prisma 클라이언트 생성**
   ```bash
   npm run generate
   ```

2. **데이터베이스 스키마 동기화**
   ```bash
   npm run dbpull
   ```

3. **데이터 임포트 실행**
   ```bash
   npm run import
   ```

## 참고 사항

- 이 코드는 `kcd9.csv` 파일을 읽어 `TKCD9` 테이블에 데이터를 추가하며, 기존 `TKCD8` 테이블과의 매칭 작업을 수행합니다.
- `import.ts`는 데이터 임포트 로직을 담고 있는 메인 스크립트입니다.
