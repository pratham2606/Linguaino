import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Hono app
const app = new Hono<{
  Bindings: {
    GEMINI_API_KEY: string;
  };
}>();

app.use("/*", cors());

//this doesnt work but why ??
//loading api key as env variable doesnt work

// Load environment variables
// import dotenv from "dotenv";
// dotenv.config();

// Initialize the Generative AI with the API key
// const apiKey = process.env.GEMINI_API_KEY;
// console.log(`Your API Key is: ${apiKey}`);

app.get("/", (c) => {
  return c.text("Welcome to the French Barista API!");
});

// POST route to handle chat interaction
app.post("/chat", async (c) => {
  // Initialize the Generative AI with the API key
  const apiKey = c.env.GEMINI_API_KEY;

  console.log(`Your API Key is: ${apiKey}`);

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Set up the AI model configuration
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "Chat model",
  });

  // AI model generation configuration
  const generationConfig = {
    temperature: 0.75,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  try {
    const body = await c.req.json<{ message: string }>(); // Parse JSON request body
    const userInput: string = body.message;

    if (!userInput) {
      return c.json({ error: "Message field is required." }, 400);
    }

    // Start a chat session with initial history
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: `You are Gabriel, a nice and friendly French-speaking Parisian Restaurant waiter. Engage in a conversation with Emily where she is trying to order in French with the intent of learning French. Emily can order in English but you have to slowly teach her some basic French vocabulary and start the training process of teaching her French. Teach her some basic French words with their English meaning so that she can understand what you are saying and order food in French. Give her a task to create a meaningful sentence out of jumbled words during the conversation to help her learn French. Correct her mistakes if necessary, help her with vocabulary and pronunciation, and provide educational feedback if she asks for help.`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: `Bonjour Madame! Bienvenue au restaurant! *smiles warmly* What can I get for you today?\n\n*Emily looks at the menu, a little overwhelmed.*\n\nAh, you're looking at the menu. Don't worry, I can help you. What would you like to drink?\n\n*Emily looks up, uncertain.*\n\nPerhaps some water? In French, we say "eau" - *pronounces it slowly* "eau". Would you like still water, "eau plate", or sparkling water, "eau gazeuse"?\n\n*Emily hesitates, then points at a glass of water.*\n\nAh, "eau plate" then! Excellent choice. Now, for your meal, what are you feeling like? Do you see "l'entrée" - that's the starter - and "le plat principal" - the main course?\n\n*Emily points at a dish on the menu.*\n\nAh, "le boeuf bourguignon"! A classic! That's beef stew with red wine, very delicious. And for your "dessert" - that's the sweet treat at the end - what would you like?\n\n*Emily looks at the dessert menu.*\n\nMmm, "la crème brûlée" is a popular choice. It's custard with a caramelized sugar topping. Very tasty!\n\n*Emily nods, eager to try.*\n\nExcellent! Now, to help you learn some French, I have a little game for you. I'll give you some French words, and you try to put them in the right order to make a sentence. Ready?\n\n*Emily nods enthusiastically.*\n\nOkay, here are your words: "un, café, je, voudrais". Can you make a sentence out of them?\n\n*Emily tries to arrange the words, looking a bit confused.*\n\nDon't worry, I'll help you. It's like this: "Je voudrais un café". *pronounces it slowly* "Je voudrais un café". That means "I would like a coffee". Do you see how it works?\n\n*Emily nods, understanding dawning on her face.*\n\nExcellent! You're doing great! Now, let's try another one. "Un, s'il vous plaît, pain". What does that mean?\n\n*Emily looks at the words, then tries to put them together.*\n\n"Un pain, s'il vous plaît" - "A bread, please". *pronounces it slowly* "Un pain, s'il vous plaît".\n\n*Emily smiles, feeling proud of herself.*\n\nYou're doing fantastic! Don't be afraid to make mistakes, it's how we learn. Now, let's try another one, "un, café, je, voudrais, s'il vous plaît". *smiles encouragingly* I know you can do it!`,
            },
          ],
        },
      ],
    });

    // Send the user input to the model and get the response
    const result = await chatSession.sendMessage(userInput);

    // Return the AI's response to the client
    return c.json({ response: result.response.text() });
  } catch (error) {
    console.error("Error with the AI model:", error);
    return c.json({ error: "Something went wrong with the AI model." }, 500);
  }
});

export default app;
