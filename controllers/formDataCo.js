import nodemailer from "nodemailer";
import Form from "../models/formData.js";

export const getMail = async (req, res) => {
  try {
    const users = await Form.find(); // Fetch all documents

    if (!users) {
      return res.status(500).json({
        message: "Something went wrong",
        success: false,
      });
    }

    res.status(200).json({
      users,
      message: "Successfully fetched form data",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: `Internal Server Error ${error.message}`,
      success: false,
    });
  }
};

// Create a single transporter instance (Reuse it for sending multiple emails)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mannutemp666@gmail.com", // Your Gmail
    pass: "estp dgpv dbew klmj",
  },
});

// Route to send email
export const sendMail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (name == "" || email == "" || message == "") {
      return res.status(500).json({
        success: false,
        message: "All Fields are requried!",
      });
    }

    // Save form data to MongoDB
    const newEntry = new Form({ name, email, message });
    await newEntry.save();

    // Email content
    let mailOptions = {
      from: "mannutemp666@gmail.com", //kahan se bejni h
      to: "sibaki4489@makroyal.com",
      subject: "New Contact Form Submission",
      text: `You have received a new message:

      Name: ${name}
      Email: ${email}
      Message: ${message}
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Email sent successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error sending email: ${error.message}`,
    });
  }
};
