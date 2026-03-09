var express = require('express');
let slugify = require('slugify')
var router = express.Router();
let modelProduct = require('../schemas/products')
let { checkLogin, checkRole } = require('../ultils/authHandler.js')

router.get('/', async function (req, res, next) {
    let queries = req.query;
    let titleQ = queries.title ? queries.title : '';
    let maxPrice = queries.maxPrice ? Number(queries.maxPrice) : 10000000;
    let minPrice = queries.minPrice ? Number(queries.minPrice) : 0;
    let limit = queries.limit ? Number(queries.limit) : 5;
    let page = queries.page ? Number(queries.page) : 1;
    let skip = limit * (page - 1);

    let query = {
        isDeleted: false,
        price: { $gte: minPrice, $lte: maxPrice },
        title: { $regex: titleQ, $options: 'i' }
    };

    try {
        let result = await modelProduct.find(query).skip(skip).limit(limit);
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;
        let result = await modelProduct.findOne({ _id: id, isDeleted: false });
        if (result) {
            res.send(result)
        } else {
            res.status(404).send({ message: "ID not found or deleted" })
        }
    } catch (error) {
        res.status(404).send({ message: "ID not found" })
    }
})

router.post('/', checkLogin, checkRole(['admin', 'mod']), async function (req, res, next) {
    try {
        let newObj = new modelProduct({
            title: req.body.title,
            slug: slugify(req.body.title, {
                replacement: '-', remove: undefined,
                locale: 'vi', trim: true
            }),
            price: req.body.price,
            description: req.body.description,
            category: req.body.category,
            images: req.body.images
        })
        await newObj.save();
        res.status(201).send(newObj)
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})

router.put('/:id', checkLogin, checkRole(['admin', 'mod']), async function (req, res, next) {
    let id = req.params.id;
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title, {
                replacement: '-', remove: undefined,
                locale: 'vi', trim: true
            });
        }
        let result = await modelProduct.findOneAndUpdate(
            { _id: id, isDeleted: false },
            req.body,
            { new: true }
        )
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "ID not found or deleted" })
        }
    } catch (error) {
        res.status(404).send({ message: "ID not found" })
    }
})

router.delete('/:id', checkLogin, checkRole(['admin']), async function (req, res, next) {
    try {
        let id = req.params.id;
        let result = await modelProduct.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        )
        if (result) {
            res.send({ message: "Deleted successfully", data: result });
        } else {
            res.status(404).send({ message: "ID not found or already deleted" })
        }
    } catch (error) {
        res.status(404).send({ message: "ID not found" })
    }
})

module.exports = router;