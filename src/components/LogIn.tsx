import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useIntl } from "react-intl";
import { Container, TextField, Button, Typography, Paper } from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const intl = useIntl();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/users");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper sx={{ p: 4, mt: 2 }}>
        <Typography variant="h5" align="center">
          {intl.formatMessage({
            id: "form.login",
          })}
        </Typography>
        <form onSubmit={handleLogin} autoComplete="off">
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            id="form-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label={intl.formatMessage({
              id: "form.password",
            })}
            type="password"
            fullWidth
            margin="normal"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2">
              {intl.formatMessage({
                id: "error.login",
              })}
            </Typography>
          )}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            {intl.formatMessage({
              id: "form.login",
            })}
          </Button>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            {intl.formatMessage({
              id: "form.signup.message",
            })}{" "}
            <Link to="/signup">
              {intl.formatMessage({
                id: "form.signup.link",
              })}
            </Link>
          </Typography>
        </form>
      </Paper>
    </Container>
  );
}
