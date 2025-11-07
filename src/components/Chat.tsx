import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPaperPlane, FaArrowLeft, FaClock } from "react-icons/fa6";
import { useIntl } from "react-intl";
import {
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  Container,
  Paper,
  Box,
  Typography,
  List,
  ListItem,
} from "@mui/material";

interface Message {
  id: string;
  text: string;
  sender: string;
  createdAt: any;
}

const Chat = () => {
  const { chatPath } = useParams<{ chatPath: string }>();

  const navigate = useNavigate();
  const intl = useIntl();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const participants = chatPath ? chatPath.split("-") : [];

  const currentUser = auth.currentUser;
  const currentUsername = currentUser?.displayName || "Anonymous";
  const recipientUsername = participants[1] || "Unknown";
  // console.log(participants)

  const chatId = [currentUsername, recipientUsername]
    .map((name) => name.replace(/\s+/g, "_"))
    .sort()
    .join("_");

  // Load messages
  useEffect(() => {
    if (!currentUser) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    const textToSend = message.trim();
    setMessage("");

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: textToSend,
        sender: currentUsername,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 5, borderRadius: 3 }}>
        <Typography
          variant="h6"
          style={{
            display: "flex",
            alignItems: "center",
            // background: "red",
            padding: "10px 15px 10px 0",
          }}
        >
          <button className="back" onClick={() => navigate("/users")}>
            <FaArrowLeft />
          </button>
          <div>
            {intl.formatMessage({
              id: "chat.with",
            })}{" "}
            {recipientUsername}
          </div>
        </Typography>

        <List
          sx={{
            height: 400,
            maxHeight: 400,
            overflowY: "auto",
            mb: 2,
            background: "rgba(0,0,0,.2)",
            borderRadius: "5px",
            "&::-webkit-scrollbar": { width: 0, background: "transparent" },
          }}
        >
          {messages.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{
                justifyContent:
                  msg.sender === currentUsername ? "flex-end" : "flex-start",
                display: "flex",
              }}
            >
              <Box
                sx={{
                  bgcolor:
                    msg.sender === currentUsername ? "#1976d2" : "#e0e0e0",
                  color: msg.sender === currentUsername ? "white" : "black",
                  px: 2,
                  py: 1,
                  borderRadius:
                    msg.sender === currentUsername
                      ? "20px 0 20px 20px"
                      : "0 20px 20px 20px",
                  display: "inline-block", // širina zavisi od sadržaja
                  maxWidth: "75%",
                }}
              >
                <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                  {msg.text}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    color:
                      msg.sender === currentUsername
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(0,0,0,0.6)",
                    mt: 0.5,
                  }}
                >
                  <span>{msg.sender}</span>
                  <span style={{ marginLeft: "10px" }}>
                    {msg.createdAt ? (
                      <span>{formatTime(msg.createdAt)}</span>
                    ) : (
                      <FaClock style={{ fontSize: "0.75rem", opacity: 0.7 }} />
                    )}
                  </span>
                </Box>
              </Box>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>

        <Box
          component="form"
          id="message-form"
          onSubmit={handleSend}
          sx={{ display: "flex", gap: 1 }}
        >
          <input
            type="text"
            placeholder={intl.formatMessage({
              id: "message.placeholder",
            })}
            className="message-input"
            id="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="message-button"
            disabled={!message.trim()}
          >
            <FaPaperPlane />
          </button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Chat;
