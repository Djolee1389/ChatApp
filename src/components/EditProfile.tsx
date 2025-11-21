import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { updateProfile, deleteUser } from "firebase/auth";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";
import {
  Button,
  TextField,
  Avatar,
  CircularProgress,
  Box,
} from "@mui/material";
import { useIntl } from "react-intl";

const EditProfile = ({ onDone }: { onDone: () => void }) => {
  const user = auth.currentUser;
  const [username, setUsername] = useState(user?.displayName || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.photoURL || null);
  const [isLoading, setIsLoading] = useState(false);

  const intl = useIntl();

  useEffect(() => {
    if (!user) return;

    const fetchUser = async () => {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPreview(data.photoURL || null);
        setUsername(data.username || user.displayName || "");
      }
    };

    fetchUser();
  }, [user]);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const avatarBase64 = file ? preview : user.photoURL || "";

      await updateProfile(user, {
        displayName: username,
      });

      await updateDoc(doc(db, "users", user.uid), {
        username,
        photoURL: avatarBase64,
      });

      onDone();
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUserChats = async (userId: string) => {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const otherUserId = userDoc.id;
      if (otherUserId === userId) continue;
      const chatId = [userId, otherUserId].sort().join("-");

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

    setIsLoading(true);
    try {
      const userId = auth.currentUser.uid;

      await deleteUserChats(userId);

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
    } finally {
      setIsLoading(false);
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

      <Button variant="contained" component="label" disabled={isLoading}>
        {preview
          ? intl.formatMessage({ id: "avatar.change" })
          : intl.formatMessage({ id: "avatar.upload" })}
        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isLoading}
        />
      </Button>

      <TextField
        variant="outlined"
        label="Username"
        style={{ width: "100%" }}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
      />

      <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ position: "relative" }}>
          <Button
            variant="contained"
            style={{ width: "100%" }}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {intl.formatMessage({ id: "save" })}
          </Button>
          {isLoading && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: "-12px",
                marginLeft: "-12px",
              }}
            />
          )}
        </Box>
        <Button
          variant="outlined"
          style={{ width: "100%", margin: "10px 0" }}
          onClick={onDone}
          disabled={isLoading}
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
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.5 : 1,
          }}
          onClick={() => handleDeleteAccount()}
          disabled={isLoading}
        >
          {intl.formatMessage({ id: "delete.account" })}
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
