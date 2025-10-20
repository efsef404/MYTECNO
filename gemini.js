import { GoogleGenerativeAI } from "@google/generative-ai";
import * as readline from 'readline/promises'; 
import { stdin as input, stdout as output } from 'process';
import 'dotenv/config'; // .envファイルを読み込むためにdotenvをインポート

// APIキーを設定
// 環境変数からAPIキーを安全に読み込む
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-2.5-flash";

async function runChat() {
    // チャットセッションを開始し、履歴を保持する
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const chat = model.startChat(); 
    
    // readlineインターフェースの作成
    const rl = readline.createInterface({ input, output });

    console.log("Geminiチャットセッションを開始します。'exit'で終了。");
    
    while (true) {
        const userInput = await rl.question('👤 あなた: ');
        
        if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
            console.log("👋 チャットを終了します。");
            rl.close();
            break;
        }

        try {
            // メッセージを文字列として直接渡す（前回修正済み）
            const result = await chat.sendMessage(userInput);

            // ⭐ 修正箇所: 確実なパス（.response.candidates...）を使用してテキストを取得
            // result.text が undefined の場合は、こちらを使います。
            const responseText = result.response.candidates[0].content.parts[0].text;
            
            console.log(`🤖 Gemini: ${responseText}`);

        } catch (error) {
            console.error("API呼び出し中にエラーが発生しました:", error);
        }
    }
}

runChat().catch(console.error);