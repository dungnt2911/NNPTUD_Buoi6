var express = require('express');
var router = express.Router();
let userController = require('../controllers/users');
let roleModel = require('../schemas/roles');
let jwt = require('jsonwebtoken')
let { checkLogin } = require('../ultils/authHandler.js')

// REGISTER
router.post('/register', async function (req, res, next) {
    try {
        const { username, password, email, role } = req.body;
        if (!role) {
            return res.status(400).send({ message: "Role is required" });
        }

        // Find role by name or ID
        let targetRole = await roleModel.findOne({
            $or: [
                { name: role },
                { _id: role }
            ],
            isDeleted: false
        });
        if (!targetRole) {
            return res.status(400).send({ message: "Role not found" });
        }

        let newUser = await userController.CreateAnUser(
            username,
            password,
            email,
            targetRole._id  // Use the found role's ID
        );
        res.send({
            message: "dang ki thanh cong"
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// LOGIN
router.post('/login', async function (req, res, next) {
    try {
        let result = await userController.QueryByUserNameAndPassword(
            req.body.username, req.body.password
        )
        if (result) {
            let token = jwt.sign({
                id: result.id
            }, 'secret', {
                expiresIn: '1h'
            })
            res.cookie("token", token, {
                maxAge: 3600000,
                httpOnly: true
            });
            res.send({ token: token, message: "Đăng nhập thành công" });
        } else {
            res.status(401).send({ message: "Sai thông tin đăng nhập" })
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ME - Profile
router.get('/me', checkLogin, async function (req, res, next) {
    res.send(req.user);
});

// LOGOUT
router.post('/logout', checkLogin, function (req, res, next) {
    res.clearCookie('token');
    res.send({ message: "Đã đăng xuất" });
});

// CHANGE PASSWORD
router.post('/change-password', checkLogin, async function (req, res, next) {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).send({ message: "Thiếu mật khẩu cũ hoặc mới" });
        }
        const result = await userController.ChangePassword(req.user._id, oldPassword, newPassword);
        if (result.success) {
            res.send({ message: result.message });
        } else {
            res.status(400).send({ message: result.message });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;