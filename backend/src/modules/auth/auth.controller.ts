import { Request, Response } from "express";
import { authService } from "./auth.service";
import { AuthenticatedRequest } from "../../middleware/auth";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        message: "Registration successful",
        user: result,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      const result = await authService.login(req.body, ipAddress, userAgent);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/api/auth/refresh",
      });

      res.json({
        accessToken: result.accessToken,
        user: result.user,
        passwordExpired: result.passwordExpired,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token" });
      }

      const result = await authService.refreshToken(refreshToken);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api/auth/refresh",
      });

      res.json({ accessToken: result.accessToken });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      await authService.logout(req.user!.sessionId, req.user!.id);
      res.clearCookie("refreshToken");
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    res.json({ user: req.user });
  }

  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        // Basic validation
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }

      await authService.changePassword(req.user!.id, newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
