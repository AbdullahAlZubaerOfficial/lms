import { Webhook } from "svix";
import User from "../models/User.js";

// API Controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        });

        const { data, type } = req.body;
        console.log("Incoming Webhook Body:", req.body);

        switch (type) {
            case 'user.created': {
                if (!data.email_addresses || data.email_addresses.length === 0) {
                    return res.status(400).json({ success: false, message: "No email address provided" });
                }

                const userData = {
                    _id: data.id,
                    email: data.email_addresses[0].email_address,
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url,
                };
                await User.create(userData);
                return res.status(201).json({ success: true });
            }

            case 'user.updated': {
                if (!data.email_addresses || data.email_addresses.length === 0) {
                    return res.status(400).json({ success: false, message: "No email address provided" });
                }

                const userData = {
                    email: data.email_addresses[0].email_address,
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url,
                };
                await User.findByIdAndUpdate(data.id, userData);
                return res.status(200).json({ success: true });
            }

            case 'user.deleted': {
                await User.findByIdAndDelete(data.id);
                return res.status(204).send();
            }

            default:
                return res.status(400).json({ success: false, message: "Unsupported event type" });
        }
    } catch (error) {
        console.error("Webhook error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};