import React, { useEffect, useState } from "react";
import {
  Form,
  required,
  useTranslate,
  useLogin,
  useNotify,
  useCheckAuth,
  useNavigate,
  TextInput,
  PasswordInput,
} from "react-admin";
import { Card, CardContent, Avatar, Button, CircularProgress, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

const rootStyle = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  height: "1px",
  alignItems: "center",
  justifyContent: "flex-start",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundImage:
    "radial-gradient(circle at 50% 14em, #313264 0%, #00023b 60%, #00023b 100%)",
};

const cardStyle = {
  minWidth: 400,
  width: 400,
  marginTop: "6em",
};

const avatarWrapStyle = {
  margin: "1em",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.5em",
};

const formContentStyle = {
  width: "100%",
  maxWidth: 400,
  paddingBottom: "16px !important",
  paddingLeft: "24px",
  paddingRight: "24px",
  boxSizing: "border-box",
  "& .MuiFormControl-root": {
    width: "100%",
  },
  // 아이디·비밀번호 입력 영역 동일 너비: 비밀번호 눈 아이콘을 절대 위치로 빼서 입력창이 같은 폭을 쓰도록 함
  "& .MuiInputBase-root": {
    width: "100%",
  },
  "& .MuiOutlinedInput-root": {
    position: "relative",
  },
  "& .MuiInputAdornment-root": {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
  },
  "& .MuiOutlinedInput-input": {
    paddingRight: "48px !important",
  },
};

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const login = useLogin();
  const translate = useTranslate();
  const notify = useNotify();
  const checkAuth = useCheckAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth({}, false)
      .then(() => navigate("/"))
      .catch(() => {});
  }, [checkAuth, navigate]);

  const submit = (values) => {
    setLoading(true);
    login(values, "/")
      .then(() => setLoading(false))
      .catch((error) => {
        setLoading(false);
        notify(
          typeof error === "string"
            ? error
            : error?.message ?? "ra.auth.sign_in_error",
          { type: "error" }
        );
      });
  };

  return (
    <div style={rootStyle}>
      <Card sx={cardStyle}>
        <div style={avatarWrapStyle}>
          <Avatar
            sx={{
              backgroundColor: (theme) =>
                (theme.vars || theme).palette?.secondary?.[500] ?? "#979DA6",
            }}
          >
            <LockIcon />
          </Avatar>
          <Typography component="h1" variant="h6" color="textPrimary">
            관리자 로그인
          </Typography>
        </div>
        <Form
          onSubmit={submit}
          mode="onChange"
          noValidate
        >
          <CardContent sx={formContentStyle}>
            <TextInput
              autoFocus
              source="username"
              label={translate("ra.auth.username")}
              autoComplete="username"
              validate={required()}
              fullWidth
            />
            <PasswordInput
              source="password"
              label={translate("ra.auth.password")}
              autoComplete="current-password"
              validate={required()}
              fullWidth
            />
            <Button
              variant="contained"
              type="submit"
              color="primary"
              disabled={loading}
              fullWidth
              sx={{ marginTop: 2 }}
            >
              {loading ? (
                <CircularProgress size={19} thickness={3} />
              ) : (
                translate("ra.auth.sign_in")
              )}
            </Button>
          </CardContent>
        </Form>
      </Card>
    </div>
  );
}
