const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.registerUser = async (req, res) => {
    // Get the required field from body
    const { email, fullName, password } = req.body
    // Validation
    if (!email || !fullName || !password) {
        return res.status(403).json(
            {
                "success": false,
                "message": "Please fill all the fields"
            }
        )
    }

    try {
        // Check if user exists
        const existingUser = await User.findOne({ email: email })
        if (existingUser) {
            return res.status(400).json({ "success": false, "message": "User exists" })
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10) // 10 salt/complexity
        // Create new instance of user
        const newUser = new User(
            {
                email : email,
                fullName: fullName,
                password: hashedPassword
            }
        )
        // Save the user data
        await newUser.save()
        return res.status(201).json({ "success": true, "message": "User registered" , data : newUser })
    } catch (e) {
        console.log(e)
        return res.status(500).json(
            {
                "success": false,
                "message": "Server error"
            }
        )
    }
}

exports.loginUser = async (req, res) => {
    const { email, password } = req.body
    // validation
    if (!email || !password) {
        return res.status(400).json(
            { "success": false, "message": "Missing Field" }
        )
    }
    try {
        const getUser = await User.findOne(
            { "email": email }
        )
        if (!getUser) {
            return res.status(400).json(
                { "success": false, "message": "User not found" }
            )
        }
        // check for password
        const passwordCheck = await bcrypt.compare(password, getUser.password) 
        if(!passwordCheck){
            return res.status(400).json(
                { "success": false, "message": "Invalid Credentials" }
            )
        }
        // jwt 
        const payload = {
            "_id": getUser._id,
            "email": getUser.email,
            "fullName": getUser.fullName
        }
        const token = jwt.sign(payload, process.env.SECRET, {expiresIn: '7d'})
        return res.status(200).json(
            {
                "success": true,
                "message": "Login successful",
                "data": getUser,
                "token": token
            }
        )
    } catch (err) {
        return res.status(500).json(
            { "success": false, "message": "Server Error" }
        )
    }
}