import type { Request, Response } from 'express';
import type { IAuthService } from '../business/AuthService.js';
import type {
    AuthSession,
    ErrorResponse,
    LoginRequest,
    LoginResponse,
    SetPasswordRequest,
} from '../shared/types.js';

export class AuthController {
    constructor(private authService: IAuthService) { }

    // POST /auth/login - Member login
    login = async (req: Request, res: Response<LoginResponse | ErrorResponse>): Promise<void> => {
        try {
            const loginRequest: LoginRequest = req.body;

            // Validate request body
            if (!loginRequest.username || !loginRequest.password) {
                res.status(400).json({
                    error: 'Username and password are required',
                    details: 'Missing required fields',
                });
                return;
            }

            const result = await this.authService.login(loginRequest);

            if (result.success) {
                // Set session cookie or handle session as needed
                res.status(200).json(result);
            } else {
                res.status(401).json({
                    error: result.message || 'Login failed',
                    details: 'Authentication failed',
                });
            }
        } catch (error) {
            console.error('Error in AuthController.login:', error);
            res.status(500).json({
                error: 'Login failed',
                details: 'Internal server error',
            });
        }
    };

    // POST /auth/set-password - Set member password
    setPassword = async (
        req: Request,
        res: Response<{ message: string } | ErrorResponse>,
    ): Promise<void> => {
        try {
            const setPasswordRequest: SetPasswordRequest = req.body;

            // Validate request body
            if (!setPasswordRequest.username || !setPasswordRequest.password) {
                res.status(400).json({
                    error: 'Username and password are required',
                    details: 'Missing required fields',
                });
                return;
            }

            const result = await this.authService.setPassword(setPasswordRequest);

            if (result.success) {
                res.status(200).json({
                    message: 'Password set successfully',
                });
            } else {
                res.status(result.statusCode || 400).json({
                    error: result.error || 'Failed to set password',
                    details: 'Password update failed',
                });
            }
        } catch (error) {
            console.error('Error in AuthController.setPassword:', error);
            res.status(500).json({
                error: 'Failed to set password',
                details: 'Internal server error',
            });
        }
    };

    // POST /auth/logout - Member logout
    logout = async (
        req: Request,
        res: Response<{ message: string } | ErrorResponse>,
    ): Promise<void> => {
        try {
            const { memberId } = req.body;

            if (!memberId) {
                res.status(400).json({
                    error: 'Member ID is required',
                    details: 'Missing required field',
                });
                return;
            }

            this.authService.logout(memberId);

            res.status(200).json({
                message: 'Logged out successfully',
            });
        } catch (error) {
            console.error('Error in AuthController.logout:', error);
            res.status(500).json({
                error: 'Logout failed',
                details: 'Internal server error',
            });
        }
    };

    // GET /auth/session - Check session status
    checkSession = async (
        req: Request,
        res: Response<{ valid: boolean; session?: AuthSession } | ErrorResponse>,
    ): Promise<void> => {
        try {
            const { memberId } = req.query;

            if (!memberId || typeof memberId !== 'string') {
                res.status(400).json({
                    error: 'Member ID is required',
                    details: 'Missing required parameter',
                });
                return;
            }

            const result = await this.authService.validateSession(memberId);

            if (result.success) {
                res.status(200).json({
                    valid: true,
                    session: result.data,
                });
            } else {
                res.status(result.statusCode || 401).json({
                    valid: false,
                });
            }
        } catch (error) {
            console.error('Error in AuthController.checkSession:', error);
            res.status(500).json({
                error: 'Session check failed',
                details: 'Internal server error',
            });
        }
    };
}
