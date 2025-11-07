import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
// import { auth } from "../firebase";
import { useIntl } from "react-intl";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";

type FormData = {
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

const SignUp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const intl = useIntl();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>();
  const password = watch("password");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) navigate("/users", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );
      await updateProfile(userCredential.user, {
        displayName: data.displayName.trim(),
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        username: data.displayName.trim(),
        createdAt: serverTimestamp(),
      });
      reset();
      navigate("/users");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper sx={{ p: 4, mt: 8, borderRadius: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Sign Up
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          autoComplete="off"
        >
          <TextField
            label="Email"
            type="email"
            fullWidth
            autoComplete="off"
            margin="normal"
            {...register("email", {
              required: intl.formatMessage({
                id: "error.email",
              }),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: intl.formatMessage({
                  id: "error.email.format",
                }),
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label={intl.formatMessage({
              id: "form.username",
            })}
            fullWidth
            margin="normal"
            {...register("displayName", {
              required: intl.formatMessage({
                id: "error.username",
              }),
            })}
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
          />

          <TextField
            label={intl.formatMessage({
              id: "form.password",
            })}
            type="password"
            fullWidth
            margin="normal"
            {...register("password", {
              required: intl.formatMessage({
                id: "error.password",
              }),
              minLength: {
                value: 6,
                message: intl.formatMessage({
                  id: "error.password.short",
                }),
              },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <TextField
            label={intl.formatMessage({
              id: "form.password.confirm",
            })}
            type="password"
            fullWidth
            margin="normal"
            {...register("confirmPassword", {
              validate: (value) =>
                value === password ||
                `${intl.formatMessage({
                  id: "error.password.confirm",
                })}`,
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          {error && (
            <Typography color="error" variant="body2" className="error">
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, mb: 1 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              intl.formatMessage({
                id: "form.signup",
              })
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignUp;
