// services/emailService.js
const nodemailer = require("nodemailer");

// Nodemailer sẽ sử dụng các biến môi trường từ .env
const transporter = nodemailer.createTransport({
  service: "gmail", // Hoặc 'smtp' nếu dùng dịch vụ khác
  auth: {
    user: process.env.EMAIL_SERVICE_USER,
    pass: process.env.EMAIL_SERVICE_PASSWORD,
  },
});

/**
 * Hàm gửi email xác nhận đơn hàng
 * @param {object} order Đơn hàng (đã populate với tên sản phẩm)
 * @param {object} user Thông tin người dùng (email, name)
 */
const sendOrderConfirmationEmail = async (order, user) => {
  // 1. Định dạng danh sách sản phẩm
  const itemsList = order.items
    .map(
      (item) =>
        `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 0; color: #343a40;">${
              item.product.name
            }</td>
            <td style="padding: 8px 0; text-align: center; color: #343a40;">${
              item.quantity
            }</td>
            <td style="padding: 8px 0; text-align: right; color: #343a40;">${item.price.toLocaleString(
              "vi-VN"
            )}₫</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #007bff;">${(
              item.price * item.quantity
            ).toLocaleString("vi-VN")}₫</td>
        </tr>
        `
    )
    .join("");

  if (!process.env.EMAIL_SERVICE_USER || !process.env.EMAIL_SERVICE_PASSWORD) {
    console.error(
      "LỖI CẤU HÌNH EMAIL: Thiếu EMAIL_SERVICE_USER hoặc EMAIL_SERVICE_PASSWORD trong .env"
    );
    return;
  }

  const mailOptions = {
    from: `"PhoneShop 📱" <${process.env.EMAIL_SERVICE_USER}>`,
    to: user.email,
    subject: `[PhoneShop] Đơn hàng #${order._id} Đã đặt thành công!`,
    html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ccc; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Xác Nhận Đơn Hàng Thành Công</h1>
                    <p style="margin: 5px 0 0;">Mã đơn hàng: ${order._id}</p>
                </div>

                <div style="padding: 25px;">
                    <p><strong>Xin chào ${
                      user.fullName || user.email
                    },</strong></p>
                    <p>Cảm ơn bạn đã tin tưởng và đặt hàng tại PhoneShop. Đơn hàng của bạn đã được ghi nhận và đang chờ xác nhận.</p>
                    
                    <div style="border: 1px solid #007bff; border-radius: 6px; padding: 15px; margin-top: 20px; background-color: #f8f9fa;">
                        <h4 style="color: #007bff; margin-top: 0;">Thông Tin Đơn Hàng</h4>
                        <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="font-weight: bold; color: #28a745;">${
                          order.status
                        }</span></p>
                        <p style="margin: 5px 0;"><strong>Ngày đặt:</strong> ${new Date(
                          order.createdAt
                        ).toLocaleDateString("vi-VN")}</p>
                        <p style="margin: 5px 0;"><strong>Thanh toán:</strong> ${
                          order.paymentMethod
                        }</p>
                    </div>

                    <h4 style="color: #333; margin-top: 25px; border-bottom: 2px solid #007bff;">Chi Tiết Sản Phẩm</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #e9ecef; color: #343a40;">
                                <th style="padding: 10px 0; text-align: left;">Sản phẩm</th>
                                <th style="padding: 10px 0; text-align: center; width: 60px;">SL</th>
                                <th style="padding: 10px 0; text-align: right; width: 100px;">Giá</th>
                                <th style="padding: 10px 0; text-align: right; width: 100px;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsList}
                        </tbody>
                    </table>

                    <table style="width: 100%; margin-top: 20px;">
                        <tr>
                            <td style="padding: 5px 0; text-align: right;">Tổng tiền hàng:</td>
                            <td style="padding: 5px 0; text-align: right; font-weight: 500;">${order.totalAmount.toLocaleString(
                              "vi-VN"
                            )}₫</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; text-align: right;">Giảm giá:</td>
                            <td style="padding: 5px 0; text-align: right; color: #dc3545;">-${order.discountAmount.toLocaleString(
                              "vi-VN"
                            )}₫</td>
                        </tr>
                        <tr style="background-color: #007bff; color: white; font-size: 18px;">
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">TỔNG THANH TOÁN:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${order.finalAmount.toLocaleString(
                              "vi-VN"
                            )}₫</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
                    <p style="margin: 0;">Nếu bạn có thắc mắc, vui lòng liên hệ chúng tôi.</p>
                    <p style="margin: 5px 0 0;">&copy; ${new Date().getFullYear()} PhoneShop. All rights reserved.</p>
                </div>
            </div>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `✅ Email xác nhận đơn hàng #${order._id} đã gửi tới: ${user.email}`
    );
  } catch (error) {
    console.error("❌ LỖI GỬI EMAIL NODEMAILER:", error.message);
  }
};

module.exports = { sendOrderConfirmationEmail };
