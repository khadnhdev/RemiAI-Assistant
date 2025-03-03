# Remin AI - Hệ Thống Gửi Email Tự Động với AI

Remin AI là một ứng dụng web giúp tự động hóa việc gửi email nhắc nhở với nội dung được tạo bởi AI (Gemini). Ứng dụng cho phép người dùng tạo và quản lý các nhắc nhở email, với khả năng tùy chỉnh lịch gửi và nội dung thông minh.

## Tính Năng Chính

- **Quản lý Nhắc Nhở**
  - Tạo và quản lý các nhắc nhở email
  - Lên lịch gửi tự động (hàng ngày, hàng tuần, hàng tháng)
  - Theo dõi lịch sử gửi email
  - Gửi email ngay lập tức khi cần

- **Tích Hợp AI (Gemini)**
  - Tự động tạo nội dung email thông minh
  - Tùy chỉnh giọng điệu và phong cách viết
  - Hỗ trợ đa ngôn ngữ (Tiếng Việt, Tiếng Anh)
  - Mẫu email được định dạng HTML đẹp mắt

- **Quản lý Người Nhận**
  - Tạo và quản lý danh sách người nhận
  - Lưu trữ thông tin liên hệ
  - Theo dõi lịch sử gửi theo từng người nhận

- **Cấu Hình AI Linh Hoạt**
  - Tùy chỉnh prompt cho AI
  - Điều chỉnh các tham số như ngôn ngữ, giọng điệu
  - Lưu trữ nhiều mẫu cấu hình khác nhau

## Cài Đặt

1. Clone repository:
```bash
git clone https://github.com/yourusername/remin-ai.git
cd remin-ai
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env từ mẫu:
```bash
cp .env.example .env
```

4. Cấu hình các biến môi trường trong .env:
```
PORT=3000
SESSION_SECRET=your_session_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CC_EMAIL=cc_email@example.com
```

5. Khởi tạo database:
```bash
npm run init-db
```

6. Chạy ứng dụng:
```bash
npm start
```

## Cấu Trúc Database

- **reminders**: Lưu trữ thông tin nhắc nhở
- **recipients**: Quản lý người nhận
- **ai_configs**: Cấu hình cho AI
- **email_history**: Lịch sử gửi email

## API Endpoints

- `GET /reminders`: Danh sách nhắc nhở
- `POST /reminders/create`: Tạo nhắc nhở mới
- `POST /reminders/trigger/:id`: Gửi email ngay
- `GET /ai-configs`: Quản lý cấu hình AI

## Công Nghệ Sử Dụng

- Node.js & Express
- SQLite3
- Google Gemini AI
- Nodemailer
- EJS Template Engine

## Tác Giả

[Your Name]

## License

MIT License 