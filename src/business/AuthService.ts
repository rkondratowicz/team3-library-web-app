import bcrypt from 'bcrypt';
import type { IMemberRepository } from '../data/MemberRepository.js';
import type {
    AuthSession,
    BusinessResult,
    LoginRequest,
    LoginResponse,
    SetPasswordRequest,
} from '../shared/types.js';

export interface IAuthService {
    login(request: LoginRequest): Promise<LoginResponse>;
    setPassword(request: SetPasswordRequest): Promise<BusinessResult<void>>;
    validateSession(memberId: string): Promise<BusinessResult<AuthSession>>;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    logout(memberId: string): void;
}

export class AuthService implements IAuthService {
    private saltRounds = 12;
    private activeSessions = new Map<string, AuthSession>();

    constructor(private memberRepository: IMemberRepository) { }

    async login(request: LoginRequest): Promise<LoginResponse> {
        try {
            // Input validation
            if (!request.username?.trim() || !request.password?.trim()) {
                return {
                    success: false,
                    message: 'Username and password are required',
                };
            }

            // Find member by username
            const member = await this.memberRepository.getMemberByUsername(request.username.trim());
            if (!member) {
                return {
                    success: false,
                    message: 'Invalid username or password',
                };
            }

            // Check if member is active
            if (member.status !== 'active') {
                return {
                    success: false,
                    message: 'Account is not active. Please contact library staff.',
                };
            }

            // Verify password
            if (!member.password_hash) {
                return {
                    success: false,
                    message: 'Password not set. Please contact library staff to set up your account.',
                };
            }

            const isValidPassword = await this.verifyPassword(request.password, member.password_hash);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Invalid username or password',
                };
            }

            // Create session
            const session: AuthSession = {
                memberId: member.id,
                username: member.username!,
                loginTime: new Date().toISOString(),
            };
            this.activeSessions.set(member.id, session);

            // Return success response (without password hash)
            // biome-ignore lint/correctness/noUnusedVariables: password_hash is intentionally extracted and discarded for security
            const { password_hash, ...memberWithoutPassword } = member;
            return {
                success: true,
                member: memberWithoutPassword,
                message: 'Login successful',
            };
        } catch (error) {
            console.error('Error in AuthService.login:', error);
            return {
                success: false,
                message: 'Login failed due to system error',
            };
        }
    }

    async setPassword(request: SetPasswordRequest): Promise<BusinessResult<void>> {
        try {
            // Input validation
            if (!request.username?.trim() || !request.password?.trim()) {
                return {
                    success: false,
                    error: 'Username and password are required',
                    statusCode: 400,
                };
            }

            // Password strength validation
            if (request.password.length < 6) {
                return {
                    success: false,
                    error: 'Password must be at least 6 characters long',
                    statusCode: 400,
                };
            }

            // Check if member exists
            const member = await this.memberRepository.getMemberByUsername(request.username.trim());
            if (!member) {
                return {
                    success: false,
                    error: 'Member not found',
                    statusCode: 404,
                };
            }

            // Hash the password
            const passwordHash = await this.hashPassword(request.password);

            // Update member with new password
            const updated = await this.memberRepository.setMemberPassword(member.id, passwordHash);
            if (!updated) {
                return {
                    success: false,
                    error: 'Failed to update password',
                    statusCode: 500,
                };
            }

            return {
                success: true,
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error in AuthService.setPassword:', error);
            return {
                success: false,
                error: 'Failed to set password',
                statusCode: 500,
            };
        }
    }

    async validateSession(memberId: string): Promise<BusinessResult<AuthSession>> {
        try {
            const session = this.activeSessions.get(memberId);
            if (!session) {
                return {
                    success: false,
                    error: 'Session not found',
                    statusCode: 401,
                };
            }

            // Check if session is still valid (24 hours)
            const sessionAge = Date.now() - new Date(session.loginTime).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            if (sessionAge > maxAge) {
                this.activeSessions.delete(memberId);
                return {
                    success: false,
                    error: 'Session expired',
                    statusCode: 401,
                };
            }

            return {
                success: true,
                data: session,
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error in AuthService.validateSession:', error);
            return {
                success: false,
                error: 'Session validation failed',
                statusCode: 500,
            };
        }
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    // Method to logout (clear session)
    logout(memberId: string): void {
        this.activeSessions.delete(memberId);
    }

    // Method to get active sessions count (for admin purposes)
    getActiveSessionsCount(): number {
        return this.activeSessions.size;
    }
}
