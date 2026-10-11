# Smart Parking

Ứng dụng Expo/React Native dành cho nhân viên giữ xe. Giao diện tiếng Việt, bốn tab chính, dữ liệu SQLite lưu trên thiết bị. Không cần tài khoản hoặc máy chủ.

## Chạy ứng dụng

Yêu cầu Node.js 22.13+ (khuyến nghị bản LTS 22 hoặc 24) và npm. Dự án dùng Expo SDK 57, React Native 0.86, NativeWind 4.2.7 và Tailwind CSS 3; không trộn cấu hình NativeWind 5/Tailwind 4.

```sh
npm install
npm start
```

Mở bằng Expo Go SDK 57 hoặc trình giả lập. `npm run android` mở Android; `npm run ios` cần macOS và iOS Simulator. Trên Windows có thể dùng Expo Go trên iPhone với cùng mạng Wi-Fi.

Nếu Metro đang chạy bản SDK cũ, nhấn `Ctrl+C`, chạy `npx expo start --clear`, rồi quét mã QR mới. Trên iPhone thật, phiên bản Expo Go phải khớp SDK dự án; không thể cài bản Expo Go cũ bằng liên kết dành cho iOS Simulator.

```sh
npm run web
npm run typecheck
npm test
npm run test:e2e
npx expo export --platform android
npx expo export --platform ios
```

Web dùng SQLite WASM, yêu cầu trình duyệt có SharedArrayBuffer. Metro đã đặt các header COOP/COEP và hỗ trợ tệp `.wasm`. Camera web cần localhost/HTTPS và quyền truy cập thiết bị. Nếu tự host bản web, phải giữ `Cross-Origin-Opener-Policy: same-origin` và `Cross-Origin-Embedder-Policy: require-corp`.

## Quy trình thử nhanh

1. Mở Tổng quan: lần chạy đầu tạo 5 xe đang gửi và 4 lượt hoàn tất.
2. Chọn Quét xe vào, nhập `59-Z1 111.22`, chọn loại xe và xác nhận. Vé có biển số, thời gian vào và QR chứa mã tham chiếu vé.
3. Quay lại Xe trong bãi: tìm biển số vừa nhập. Nhận cùng biển số lần nữa phải báo trùng và không tạo vé mới.
4. Mở chi tiết xe, chọn Làm thủ tục xe ra. Kiểm tra phí, ảnh nếu có; tích “Đã kiểm tra thông tin xe và xác nhận trả xe”, rồi xác nhận. Có thể bỏ chọn thu tiền để lưu trạng thái chưa thanh toán.
5. Xe biến mất khỏi danh sách đang gửi, xuất hiện trong Lịch sử; Tổng quan cập nhật lượt xe và tiền mặt đã thu.
6. Đóng và mở lại ứng dụng: vé, lịch sử, ảnh và cấu hình vẫn còn.
7. Thử camera trên thiết bị thật, từ chối quyền rồi nhập thủ công. Khi bật demo, chọn biển số mẫu để nhận diện mô phỏng; kết quả luôn được ghi nhãn, không phải OCR thật.
8. Trong Cài đặt, lưu sức chứa bằng số xe hiện có: nhận xe mới bị chặn. Bật và lưu Cho phép vượt sức chứa để cho phép tiếp nhận.
9. Đổi giá sau khi trả xe: phí lịch sử vẫn theo giá đã chốt. Đặt lại dữ liệu demo luôn cần xác nhận và xóa toàn bộ vé/ảnh, bao gồm lịch sử.

## Cấu trúc

- `app/`: Expo Router; bốn tab và các màn hình xác nhận, vé, chi tiết, cài đặt.
- `src/database/`: giao diện kết nối, schema SQLite phiên bản 1 và repository; toàn bộ truy cập được xếp hàng, giao dịch `BEGIN IMMEDIATE`, unique index chặn biển số trùng đang gửi.
- `src/services/pricing/`: tính phí mỗi block đã bắt đầu, tối thiểu một block; lưu snapshot thời lượng, đơn giá, số block và thời gian thực tế.
- `src/services/recognition/`: `LicensePlateRecognizer` có thể thay bằng OCR thật. Bản hiện tại chỉ nhận diện mô phỏng được ghi nhãn. Tắt demo sử dụng ảnh và nhập tay.
- `src/services/images.ts`: sao chép ảnh camera sang thư mục tài liệu riêng; web lưu ảnh dạng data URI trong SQLite; đặt lại demo dọn ảnh liên quan.
- `src/stores/`: Zustand giữ dữ liệu đã đọc từ repository và cập nhật màn hình sau giao dịch thành công.
- `tests/`: kiểm tra nghiệp vụ với SQLite thật qua `node:sqlite`, biên tính phí, giao dịch, lịch sử và ngày địa phương.

Thời điểm lưu theo ISO UTC; hiển thị và ranh giới ngày theo múi giờ thiết bị. Doanh thu là tổng phí đã đánh dấu thu tiền mặt, không gồm lượt chưa thanh toán.

## Phạm vi demo

Không tích hợp OCR thật, máy in, cổng thanh toán, xác thực hoặc đồng bộ máy chủ. QR chỉ chứa tham chiếu vé. Nhân viên phải đối chiếu phương tiện và bằng chứng sở hữu trước khi trả xe; biển số hoặc QR đơn lẻ không chứng minh quyền nhận xe. Giá khởi tạo chỉ là ví dụ, có thể sửa trong Cài đặt.

Kiểm thử giao diện dùng Chrome đã cài trên máy, kích thước 390 × 844. Chạy `npm run test:e2e` để kiểm tra luồng nhận/trả xe, vé, chặn trùng, lịch sử sau tải lại, sửa tay khi nhận diện demo, sức chứa và hộp xác nhận đặt lại. Ảnh kiểm tra được lưu trong `test-results/`.

Việc đóng gói và test tự động không thay thế kiểm tra camera, đèn pin, bàn phím và quyền truy cập trên thiết bị Android/iOS thật.

`npm audit` sau nâng SDK 57 báo 35 cảnh báo từ cây thư viện (14 moderate, 21 high), gồm các phụ thuộc của Expo, Metro và Tailwind. Một số đề xuất tự động đổi major không tương thích bộ SDK này; chưa áp dụng `audit fix --force`. Cần rà soát các cảnh báo và phiên bản SDK trước khi sử dụng ngoài phạm vi MVP demo.

Tài liệu cấu hình: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Nâng cấp Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [NativeWind 4](https://www.nativewind.dev/docs/getting-started/installation), [Expo Camera](https://docs.expo.dev/versions/v57.0.0/sdk/camera/), [Expo SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/).
