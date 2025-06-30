export const clerkWebhooks = async (req, res) => {
    try {
        // 👇 Temporarily disable svix verification
        // const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        // await whook.verify(JSON.stringify(req.body), {
        //     "svix-id": req.headers["svix-id"],
        //     "svix-timestamp": req.headers["svix-timestamp"],
        //     "svix-signature": req.headers["svix-signature"],
        // });

        console.log("🔥 Headers:", req.headers);
        console.log("🔥 Body:", req.body);

        // You can return a dummy response to check if it's hitting
        return res.status(200).json({ success: true, message: "Webhook received" });

    } catch (error) {
        console.error("Webhook error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
