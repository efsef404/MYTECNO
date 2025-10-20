import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const app = express();
const port = 3001;

// ミドルウェアの設定
app.use(cors()); // フロントエンドからのリクエストを許可
app.use(express.json()); // JSON形式のリクエストボディを解析

// Gemini APIの初期化
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in .env file");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// チャットAPIのエンドポイント
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 履歴を考慮したチャットセッションを開始
        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.candidates[0].content.parts[0].text;

        res.json({ reply: responseText });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});