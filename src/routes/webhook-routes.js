const express = require('express');
const router = express.Router();

// Xử lý POST request đến /webhook
router.post('/', async (req, res) => {
    try {
        // Log dữ liệu webhook nhận được
        console.log('Webhook payload:', req.body);

        // Xử lý dữ liệu webhook ở đây
        const webhookType = req.body.type;
        
        switch (webhookType) {
            case 'payment':
                console.log('Xử lý webhook thanh toán');
                break;
            case 'order':
                console.log('Xử lý webhook đơn hàng');
                break;
            default:
                console.log('Loại webhook không được hỗ trợ');
        }

        res.status(200).json({
            success: true,
            message: 'Webhook đã được xử lý'
        });
    } catch (error) {
        console.error('Lỗi xử lý webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xử lý webhook'
        });
    }
});

router.get('/', (req, res) => {
    res.send('Hello World');
});

module.exports = router;  // Export router thay vì một object