import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaMessage,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa6";

interface ChatMessage {
  text: string;
  isUser: boolean;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

const quickReplies = [
  "How do I use the route map?",
  "How do I mark a report resolved?",
  "Who should I contact?",
];

const getDemoResponse = (prompt: string) => {
  const question = prompt.toLowerCase();

  if (question.includes("route") || question.includes("map") || question.includes("gps")) {
    return "Use the route map on the driver dashboard to view the assigned route. You can also click any location in the report table to open that exact point in Google Maps.";
  }

  if (question.includes("resolved") || question.includes("complete") || question.includes("done")) {
    return "To mark work as complete, use the Resolved checkbox in the report table. The dashboard counters update instantly for this demo session.";
  }

  if (question.includes("invalid") || question.includes("wrong")) {
    return "If a report is incorrect, use the Invalid checkbox. This helps separate genuine waste reports from duplicate or incorrect submissions.";
  }

  if (question.includes("contact") || question.includes("supervisor") || question.includes("help")) {
    return "For help, contact Manas Patil at 9028015213. Share your current location, vehicle number, and the report ID.";
  }

  if (question.includes("vehicle") || question.includes("breakdown")) {
    return "If the vehicle has a breakdown, stop safely, note your current location from the map, and contact Manas Patil at 9028015213 with the vehicle number.";
  }

  return "I can help with route map usage, report status updates, invalid reports, vehicle breakdowns, and supervisor contact details. For urgent help, call Manas Patil at 9028015213.";
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      text: "Hi, I am the driver help assistant. Ask me about routes, reports, or supervisor contact.",
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognition = useMemo(() => {
    if (typeof window === "undefined") return null;
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return null;

    const instance = new SpeechRecognitionAPI();
    instance.continuous = false;
    instance.interimResults = true;
    instance.lang = "en-US";
    return instance;
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      setInputText(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    return () => recognition.stop();
  }, [recognition]);

  const sendMessage = (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setMessages((prev) => [
      ...prev,
      { text: trimmedMessage, isUser: true },
      { text: getDemoResponse(trimmedMessage), isUser: false },
    ]);
    setInputText("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-4 w-80 overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200">
          <div className="bg-[#2e7d32] p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  setMessages([
                    {
                      text: "Hi, I am the driver help assistant. Ask me about routes, reports, or supervisor contact.",
                      isUser: false,
                    },
                  ])
                }
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Reset chat"
              >
                <FaArrowLeft size={16} />
              </button>
              <h3 className="text-lg font-semibold text-white">
                Driver Help
              </h3>
              <span className="w-4" />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.text}-${idx}`}
                className={`mb-3 ${msg.isUser ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block max-w-[90%] rounded-lg p-3 text-sm leading-relaxed ${
                    msg.isUser
                      ? "bg-[#2e7d32] text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-2 bg-white">
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => sendMessage(reply)}
                  className="rounded-full border border-[#a5d6a7] px-3 py-1 text-xs text-[#1b5e20] hover:bg-[#f1f8e9]"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="min-w-0 flex-1 rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#81c784]"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`rounded p-2 text-white transition-colors ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-[#2e7d32] hover:bg-[#1b5e20]"
                }`}
                disabled={!recognition}
                aria-label="Use voice input"
              >
                {isListening ? (
                  <FaMicrophoneSlash size={18} />
                ) : (
                  <FaMicrophone size={18} />
                )}
              </button>
              <button
                type="submit"
                className="rounded bg-[#2e7d32] px-3 text-white hover:bg-[#1b5e20]"
                aria-label="Send message"
              >
                <FaArrowRight />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2e7d32] text-white shadow-lg transition-colors hover:bg-[#1b5e20]"
        aria-label="Open driver help chat"
      >
        <FaMessage size={20} />
      </button>
    </div>
  );
};

export default ChatBot;
