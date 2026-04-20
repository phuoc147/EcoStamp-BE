# EcoStamp-BE

Backend cho hệ thống EcoStamp, xây dựng bằng Express + TypeScript + Drizzle ORM + PostgreSQL.

## Mục tiêu dự án

- Quản lý xác thực và phân quyền theo vai trò (USER, EMPLOYEE, PARTNER)
- Quản lý địa chỉ/hành chính và vị trí người dùng
- Ghi nhận giao dịch rác và quy trình duyệt giao dịch
- Chuẩn hóa API contract bằng Zod + OpenAPI

## Công nghệ sử dụng

- Runtime: Node.js
- Framework: Express 5
- Language: TypeScript
- ORM: Drizzle ORM
- Database: PostgreSQL
- Validation/Contract: Zod
- API docs: zod-to-openapi + Swagger UI

## Cài đặt và chạy

1. Cài dependency

```bash
npm install
```

2. Tạo file .env

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/ecostamp
```

3. Chạy dev

```bash
npm run dev
```

4. Chạy production local

```bash
npm run start
```

5. Kiểm tra kiểu dữ liệu

```bash
npm run typecheck
```

## Endpoint hệ thống

- Health check: /health
- Swagger UI: /api-docs

## Tổ chức code hiện tại

```text
src/
├── app.ts                     # Entry point, mount routes + middlewares
├── config/
│   └── index.ts               # Đọc và expose env
├── common/
│   ├── dto/
│   │   └── api-response.ts    # Schema response chuẩn
│   └── http/
│       └── response.ts        # Helper sendSuccess/sendError
├── db/
│   ├── index.ts               # Drizzle + PG pool
│   ├── schema.ts              # Barrel export schema
│   └── schema/                # Entity schema theo từng bảng
├── docs/
│   └── openapi.ts             # Build OpenAPI document
├── middlewares/
│   ├── auth.ts                # auth, userAuth, employeeAuth, partnerAuth, employeeOrPartnerAuth
│   └── error.ts               # HttpError, notFoundHandler, errorHandler
├── modules/
│   ├── auth/
│   │   ├── routes.ts
│   │   ├── controller/
│   │   │   └── auth-controller.ts
│   │   ├── services/
│   │   │   └── auth-service.ts
│   │   ├── repository/
│   │   │   └── auth-repo.ts
│   │   └── dto/
│   │       └── auth-dto.ts
│   ├── address/
│   │   ├── routes.ts
│   │   ├── controller/
│   │   │   └── address-controller.ts
│   │   ├── services/
│   │   │   └── address-service.ts
│   │   ├── repository/
│   │   │   └── address-repo.ts
│   │   └── dto/
│   │       └── address-dto.ts
│   ├── waste-transaction/
│   │   ├── routes.ts
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   └── dto.ts
│   ├── user/
│   │   ├── dto/
│   │   │   └── profile-dto.ts
│   │   └── repository/
│   │       └── profile-repo.ts
│   ├── voucher/
│   │   └── route.ts           # Placeholder
│   └── _exp_module/
│       └── route.ts           # Placeholder
└── utils/
    └── hash.ts
```

## Nguyên tắc tổ chức theo tầng

- routes: định nghĩa endpoint và middleware guard
- controller: nhận request, validate, trả response
- service: xử lý nghiệp vụ
- repository: truy cập dữ liệu
- dto: định nghĩa contract Req/Res bằng Zod


## Tài liệu bổ sung

- schema.sql: DDL tham chiếu cho database
- dbdiagram.io: mô hình dữ liệu trực quan
- system_flow.md: mô tả luồng nghiệp vụ tổng thể

