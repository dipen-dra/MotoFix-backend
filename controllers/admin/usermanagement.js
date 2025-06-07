// CRUD
const User = require("../../models/User")
const bcrypt = require("bcrypt")

// Create
exports.createUser = async (req, res) => {
    const { username, email, firstName, lastName, password } = req.body
    // validation
    if (!username || !email || !firstName 
        || !lastName || !password) {
        return res.status(400).json(
            { "success": false, "message": 
                "Missing field" }
        )
    }
    try {
        const existingUser = await User.findOne(
            {
                $or: [{ username: username }, 
                    { email: email }]
            }
        )
        if (existingUser) {
            return res.status(400).json({ "success": false, "message": "User exists" })
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(
            password, 10) // 10 salt/complexity
        // Create new instance of user
        const newUser = new User(
            {
                username,
                email,
                firstName: firstName,
                lastName: lastName,
                password: hashedPassword
            }
        )
        // Save the user data
        await newUser.save()
        return res.status(201).json({ "success": true, "message": "User registered" })
    } catch (e) {
        return res.status(500).json(
            { "success": false, "message": "Server errror" }
        )
    }
}
// Read All
exports.getUsers = async (req, res) => {
    try{
        console.log(req.user)
        const users = await User.find();
        return res.status(200).json(
            {
                "success": true,
                "message": "Data fetched",
                "data": users
            }
        )
    }catch(err){
        return res.status(500).json(
            {"success": false, "message": "Server error"}
        )
    }
}
// Read one
exports.getOneUser = async (req, res) => {
    try{    
        const _id = req.params.id // use mongo id
        const user = await User.findById(_id)
        return res.status(200).json(
            {
                "success": true,
                "message": "One user fetched",
                "data": user
            }
        )
    }catch(err){
        return res.status(500).json(
            {"success": false, "message": "Server Error"}
        )
    }
}
// update
exports.updateOneUser = async (req, res) => {
    const {firstName, lastName } = req.body
    const _id = req.params.id
    try{
        const user = await User.updateOne(
            {
                "_id": _id
            },
            {
                $set: {
                    "firstName": firstName,
                    "lastName": lastName
                }
            },
        )
        return res.status(200).json(
            {"success": true, "message": "User data udpated"}
        )
    }catch(err){
        return res.status(500).json(
            {"success": false, "message": "Server Error"}
        )
    }
}

// Delete
exports.deleteOneUser = async (req, res) => {
    try{
        const _id = req.params.id
        const user = await User.deleteOne(
            {
                "_id": _id
            }
        )
        return res.status(200).json(
            {"success": true, "message": "User deleted"}
        )
    }catch(err){
        return res.status(500).json(
            {"succss": false, "message": "Server Error"}
        )
    }
}