import {
  Bot,
  Plus,
  Send,
  MessageSquare,
  Sparkles,
  LoaderCircle,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  createConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
} from "../services/chatService";

function AIChat() {
  const { projectId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState("");

  const [loadingConversations, setLoadingConversations] = useState(true);

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [sendingMessage, setSendingMessage] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // LOAD CONVERSATIONS
  // ==========================================

  useEffect(() => {
    async function loadConversations() {
      try {
        setLoadingConversations(true);
        setError("");

        const data = await getConversations(projectId);

        setConversations(data);

        if (data.length > 0) {
          setActiveConversation(data[0]);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);

        setError(
          error.response?.data?.detail || "Failed to load conversations.",
        );
      } finally {
        setLoadingConversations(false);
      }
    }

    if (projectId) {
      loadConversations();
    }
  }, [projectId]);

  // ==========================================
  // LOAD MESSAGES WHEN CONVERSATION CHANGES
  // ==========================================

  useEffect(() => {
    async function loadMessages() {
      if (!activeConversation?.id) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setError("");

        const data = await getConversationMessages(
          projectId,
          activeConversation.id,
        );

        setMessages(data);
      } catch (error) {
        console.error("Failed to load messages:", error);

        setError(error.response?.data?.detail || "Failed to load messages.");
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [projectId, activeConversation]);

  // ==========================================
  // CREATE NEW CONVERSATION
  // ==========================================

  const handleCreateConversation = async () => {
    try {
      setError("");

      const conversation = await createConversation(projectId, "New Chat");

      setConversations((previous) => [conversation, ...previous]);

      setActiveConversation(conversation);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create conversation:", error);

      setError(
        error.response?.data?.detail || "Failed to create conversation.",
      );
    }
  };

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSendMessage = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    if (!activeConversation?.id) {
      setError("Please create a conversation first.");
      return;
    }

    if (sendingMessage) {
      return;
    }

    try {
      setSendingMessage(true);
      setError("");

      // Immediately show user's message
      const temporaryUserMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: trimmedQuestion,
      };

      setMessages((previous) => [...previous, temporaryUserMessage]);

      setQuestion("");

      // Send to backend
      const response = await sendMessage(
        projectId,
        activeConversation.id,
        trimmedQuestion,
      );

      // Backend returns the assistant message
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
      };

      setMessages((previous) => [...previous, assistantMessage]);

      // Refresh conversations so updated_at changes
      const updatedConversations = await getConversations(projectId);

      setConversations(updatedConversations);
    } catch (error) {
      console.error("Failed to send message:", error);

      // Remove temporary user message
      setMessages((previous) =>
        previous.filter((message) => !message.id?.startsWith("temp-")),
      );

      setError(error.response?.data?.detail || "Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // ==========================================
  // EXAMPLE QUESTION
  // ==========================================

  const handleExampleQuestion = (example) => {
    setQuestion(example);
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#020617]">
      {/* ================= SIDEBAR ================= */}

      <aside className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#050817]">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Conversations</h2>

            <p className="mt-1 text-xs text-slate-500">Your project chats</p>
          </div>

          <button
            onClick={handleCreateConversation}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="New conversation"
          >
            <Plus size={17} />
          </button>
        </div>

        {/* Conversation list */}

        <div className="flex-1 overflow-y-auto p-3">
          {loadingConversations ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <LoaderCircle size={14} className="animate-spin" />
                Loading conversations...
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="px-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                  <MessageSquare size={18} className="text-slate-500" />
                </div>

                <p className="mt-3 text-sm text-slate-400">
                  No conversations yet
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Start a new conversation to ask questions about your sources.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full rounded-lg px-3 py-3 text-left transition ${
                    activeConversation?.id === conversation.id
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={16} />

                    <div className="min-w-0">
                      <p className="truncate text-sm">{conversation.title}</p>

                      <p className="mt-1 text-[11px] text-slate-600">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ================= CHAT AREA ================= */}

      <main className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#020617]">
        {/* Chat header */}

        <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
            <Bot size={19} className="text-slate-300" />
          </div>

          <div>
            <h1 className="text-sm font-semibold text-white">AI Chat</h1>

            <p className="text-xs text-slate-500">
              Ask questions about your project knowledge
            </p>
          </div>
        </header>

        {/* Error */}

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ================= MESSAGES ================= */}

        <div className="flex-1 overflow-y-auto">
          {loadingMessages ? (
            <div className="flex min-h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <LoaderCircle size={17} className="animate-spin" />
                Loading messages...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-full items-center justify-center px-6">
              <div className="max-w-xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <Sparkles size={25} className="text-slate-400" />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-white">
                  Ask your knowledge anything
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Ask questions about the documents, articles, and other sources
                  you've added to this project.
                </p>

                {/* Example questions */}

                <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                  <button
                    onClick={() =>
                      handleExampleQuestion("Summarize my sources")
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-xs text-slate-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-slate-300"
                  >
                    Summarize my sources
                  </button>

                  <button
                    onClick={() =>
                      handleExampleQuestion("What are the key findings?")
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-xs text-slate-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-slate-300"
                  >
                    What are the key findings?
                  </button>

                  <button
                    onClick={() => handleExampleQuestion("Compare the sources")}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-xs text-slate-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-slate-300"
                  >
                    Compare the sources
                  </button>

                  <button
                    onClick={() =>
                      handleExampleQuestion("Find important facts")
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-xs text-slate-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-slate-300"
                  >
                    Find important facts
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-8">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {sendingMessage && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Bot size={16} className="text-slate-300" />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <LoaderCircle size={14} className="animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= INPUT ================= */}

        <div className="shrink-0 border-t border-white/10 bg-[#020617] p-4">
          <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2">
            <textarea
              rows={1}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sendingMessage || !activeConversation}
              placeholder={
                activeConversation
                  ? "Ask anything about your sources..."
                  : "Create a conversation first..."
              }
              className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              onClick={handleSendMessage}
              disabled={
                sendingMessage || !question.trim() || !activeConversation
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              title="Send message"
            >
              {sendingMessage ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-slate-600">
            InsightFlow answers using your project sources.
          </p>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// MESSAGE COMPONENT
// ==========================================

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
          <Bot size={16} className="text-slate-300" />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-6 ${
          isUser
            ? "bg-white text-slate-950"
            : "border border-white/10 bg-white/[0.03] text-slate-300"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Sources */}

        {!isUser && message.sources?.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="mb-2 text-xs font-semibold text-slate-400">Sources</p>

            <div className="space-y-2">
              {message.sources.map((source, index) => (
                <div
                  key={`${source.source_id}-${index}`}
                  className="rounded-lg bg-white/[0.03] p-3"
                >
                  <p className="text-xs font-medium text-slate-300">
                    [{source.citation_index}] {source.title}
                  </p>

                  {source.excerpt && (
                    <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-slate-500">
                      {source.excerpt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIChat;
