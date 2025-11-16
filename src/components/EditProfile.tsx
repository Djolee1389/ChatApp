import { useState, useEffect } from "react";
import { auth, db, storage } from "../firebase";
import { updateProfile, deleteUser } from "firebase/auth";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { Button, TextField, Avatar } from "@mui/material";
import { uploadBytes, ref, getDownloadURL } from "firebase/storage";
import { useIntl } from "react-intl";

const EditProfile = ({ onDone }: { onDone: () => void }) => {
  const user = auth.currentUser;
  const [username, setUsername] = useState(user?.displayName || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.photoURL || null);

  const intl = useIntl();

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const handleSubmit = async () => {
    if (!user) return;

    const oldUsername = user.displayName || "";

    let avatarUrl = user.photoURL;

    if (file) {
      const avatarRef = ref(storage, `avatars/${user.uid}.jpg`);
      await uploadBytes(avatarRef, file);
      avatarUrl = await getDownloadURL(avatarRef);
    }

    await updateProfile(user, {
      displayName: username,
      photoURL: avatarUrl,
    });

    await updateDoc(doc(db, "users", user.uid), {
      username,
      photoURL: avatarUrl,
    });

    // If username changed, rename chats
    if (oldUsername && oldUsername !== username) {
      try {
        await renameUserChats(oldUsername, username);
      } catch (err) {
        console.error("Failed to rename chats:", err);
      }
    }

    onDone();
  };

  const renameUserChats = async (
    oldUsername: string,
    newUsername: string
  ): Promise<void> => {
    const oldNorm = oldUsername.replace(/\s+/g, "_");
    const newNorm = newUsername.replace(/\s+/g, "_");

    // Get all users to construct chat ids (same logic as Chat.tsx)
    const usersSnapshot = await getDocs(collection(db, "users"));

    for (const userDoc of usersSnapshot.docs) {
      const otherUsername = userDoc.data().username;
      if (!otherUsername || otherUsername === oldUsername) continue;

      const otherNorm = otherUsername.replace(/\s+/g, "_");
      const oldChatId = [oldNorm, otherNorm].sort().join("-");
      const newChatId = [newNorm, otherNorm].sort().join("-");

      if (oldChatId === newChatId) continue;

      const oldMessagesRef = collection(db, "chats", oldChatId, "messages");
      const oldMessagesSnap = await getDocs(oldMessagesRef);

      if (oldMessagesSnap.size > 0) {
        for (const msgDoc of oldMessagesSnap.docs) {
          const data = msgDoc.data();
          await setDoc(
            doc(db, "chats", newChatId, "messages", msgDoc.id),
            data
          );
        }

        for (const msgDoc of oldMessagesSnap.docs) {
          await deleteDoc(msgDoc.ref);
        }

        try {
          await deleteDoc(doc(db, "chats", oldChatId));
        } catch (err) {
          console.warn(`Could not delete old chat doc ${oldChatId}:`, err);
        }
      }
    }
  };

  const deleteUserChats = async (username: string) => {
    const normalizedUsername = username.replace(/\s+/g, "_");
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const otherUsername = userDoc.data().username;
      if (otherUsername === username) continue;
      const otherNormalized = otherUsername.replace(/\s+/g, "_");
      const chatId = [normalizedUsername, otherNormalized].sort().join("-");

      const messagesRef = collection(db, "chats", chatId, "messages");
      const messagesSnapshot = await getDocs(messagesRef);
      if (messagesSnapshot.size > 0) {
        for (const msgDoc of messagesSnapshot.docs) {
          await deleteDoc(msgDoc.ref);
        }
        await deleteDoc(doc(db, "chats", chatId));
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !user) return;

    const isConfirmed = confirm(
      intl.formatMessage({ id: "delete.account.confirm" })
    );
    if (!isConfirmed) return;

    try {
      const userId = auth.currentUser.uid;
      const username = user.displayName || "";

      await deleteUserChats(username);

      await deleteDoc(doc(db, "users", userId));

      await deleteUser(auth.currentUser);

      alert(intl.formatMessage({ id: "delete.account.success" }));
      onDone();
    } catch (err) {
      console.error("Account deletion error:", err);

      if ((err as any).code === "auth/requires-recent-login") {
        alert(intl.formatMessage({ id: "delete.account.loginagain" }));
      } else {
        alert(intl.formatMessage({ id: "delete.account.failure" }));
      }
    }
  };

  return (
    <div
      style={{
        width: "300px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
      }}
    >
      <h3>{intl.formatMessage({ id: "profile.edit" })}</h3>
      <Avatar src={preview || ""} sx={{ width: 80, height: 80 }} />

      <Button variant="contained" component="label">
        {preview
          ? intl.formatMessage({ id: "avatar.change" })
          : intl.formatMessage({ id: "avatar.upload" })}
        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </Button>

      <TextField
        variant="outlined"
        label="Username"
        style={{ width: "100%" }}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <Button
          variant="contained"
          style={{ width: "100%" }}
          onClick={handleSubmit}
        >
          {intl.formatMessage({ id: "save" })}
        </Button>
        <Button
          variant="outlined"
          style={{ width: "100%", margin: "10px 0" }}
          onClick={onDone}
        >
          {intl.formatMessage({ id: "cancel" })}
        </Button>
        <button
          style={{
            background: "none",
            outline: "none",
            border: "none",
            textDecoration: "underline",
            color: "red",
            cursor: "pointer",
          }}
          onClick={() => handleDeleteAccount()}
        >
          {intl.formatMessage({ id: "delete.account" })}
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
