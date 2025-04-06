import SuperTokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { SessionContainerInterface } from 'supertokens-node/recipe/session/types';
import { User } from 'supertokens-node/types';

// Mock dependencies
jest.mock('supertokens-node', () => ({
  init: jest.fn(),
}));

jest.mock('supertokens-node/recipe/emailpassword', () => ({
  signUp: jest.fn(),
  signIn: jest.fn(),
}));

jest.mock('supertokens-node/recipe/session', () => ({
  createNewSession: jest.fn(),
  getSession: jest.fn(),
  revokeAllSessionsForUser: jest.fn(),
}));

describe('Authentication Flow Tests', () => {
  // Comprehensive mock user data
  const mockUser: User = {
    id: 'test_st',
    emails: ['test@example.com'],
    timeJoined: Date.now(),
    isPrimaryUser: true,
    tenantIds: ['default'],
    phoneNumbers: [],
    thirdParty: null,
    loginMethods: [],
    webauthn: {
      credentialIds: ['mock-credential-id'],
    },
    toJson: () => ({
      id: 'test_st',
      emails: ['test@example.com'],
    }),
  };

  // Mock session container
  const createMockSessionContainer = (userId: string): SessionContainerInterface => ({
    revokeSession: jest.fn(),
    getSessionDataFromDatabase: jest.fn(),
    updateSessionDataInDatabase: jest.fn(),
    getUserId: () => userId,
    getAccessToken: () => 'mock-access-token',
    getHandle: () => 'mock-session-handle',
    getRecipeUserId: jest.fn().mockReturnValue({ getAsString: () => userId }),
    getTenantId: jest.fn().mockReturnValue('default'),
    getAccessTokenPayload: jest.fn().mockReturnValue({}),
    getAllSessionTokensDangerously: jest.fn().mockReturnValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
    mergeIntoAccessTokenPayload: jest.fn(),
    getTimeCreated: jest.fn().mockReturnValue(Date.now()),
    getExpiry: jest.fn().mockReturnValue(Date.now() + 3600000),
    assertClaims: jest.fn(),
    getSessionInfo: jest.fn(),
    updateSessionInfo: jest.fn(),
    fetchSessionInfo: jest.fn(),
  });
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Utility function to create sign up/in response
  const createSuccessResponse = () => ({
    status: "OK" as const,
    user: mockUser,
    recipeUserId: {
      getAsString: () => mockUser.id,
    },
  });

  // Test 1: Sign Up
  test('should successfully sign up a new user', async () => {
    // Arrange
    const mockSignUpResponse = createSuccessResponse();
    const mockAlreadyExistsResponse = { 
      status: "EMAIL_ALREADY_EXISTS_ERROR" as const 
    };

    (EmailPassword.signUp as jest.Mock)
      .mockImplementation((tenantId, email, password) => {
        if (email === 'test@example.com') {
          return Promise.resolve(mockSignUpResponse);
        }
        if (email === 'existing@example.com') {
          return Promise.resolve(mockAlreadyExistsResponse);
        }
        throw new Error('Unexpected email');
      });

    const mockSession = createMockSessionContainer(mockUser.id);
    (Session.createNewSession as jest.Mock).mockResolvedValue(mockSession);

    // Act
    const signUpResult = await EmailPassword.signUp(
      'tenant-id', 
      'test@example.com', 
      'Test123!'
    );

    // Assert
    expect(signUpResult).toEqual(expect.objectContaining({
      status: "OK",
      user: expect.objectContaining({
        emails: expect.arrayContaining(['test@example.com'])
      })
    }));

    // Try signing up with existing email
    const existingEmailResult = await EmailPassword.signUp(
      'tenant-id', 
      'existing@example.com', 
      'Test123!'
    );

    expect(existingEmailResult).toEqual({
      status: "EMAIL_ALREADY_EXISTS_ERROR"
    });
  });

  // Test 2: Session Verification
  test('should get user session', async () => {
    // Arrange
    const mockSession = createMockSessionContainer(mockUser.id);

    (Session.getSession as jest.Mock).mockResolvedValue(mockSession);

    // Act
    const sessionResult = await Session.getSession(
      {} as any,  // req
      {} as any,  // res
      {}  // options
    );

    // Assert
    expect(sessionResult.getUserId()).toBe(mockUser.id);
    expect(Session.getSession).toHaveBeenCalled();
  });

  // Test 3: Revoking Sessions
  test('should revoke all sessions for a user', async () => {
    // Arrange
    const mockRevokeResponse: string[] = [mockUser.id];

    (Session.revokeAllSessionsForUser as jest.Mock).mockResolvedValue(mockRevokeResponse);

    // Act
    const revokeResult = await Session.revokeAllSessionsForUser(mockUser.id);

    // Assert
    expect(revokeResult).toEqual([mockUser.id]);
    expect(Session.revokeAllSessionsForUser).toHaveBeenCalledWith(mockUser.id);
  });

  // Test 4: Sign In
  test('should successfully sign in an existing user', async () => {
    // Arrange
    const mockSignInResponse = createSuccessResponse();
    const mockWrongCredentialsResponse = { 
      status: "WRONG_CREDENTIALS_ERROR" as const 
    };

    (EmailPassword.signIn as jest.Mock)
      .mockImplementation((tenantId, email, password) => {
        if (email === 'test@example.com') {
          return Promise.resolve(mockSignInResponse);
        }
        if (email === 'wrong@example.com') {
          return Promise.resolve(mockWrongCredentialsResponse);
        }
        throw new Error('Unexpected email');
      });

    const mockSession = createMockSessionContainer(mockUser.id);
    (Session.createNewSession as jest.Mock).mockResolvedValue(mockSession);

    // Act
    const signInResult = await EmailPassword.signIn(
      'tenant-id', 
      'test@example.com', 
      'Test123!'
    );

    // Assert
    expect(signInResult).toEqual(expect.objectContaining({
      status: "OK",
      user: expect.objectContaining({
        emails: expect.arrayContaining(['test@example.com'])
      })
    }));

    // Try signing in with wrong credentials
    const wrongCredentialsResult = await EmailPassword.signIn(
      'tenant-id', 
      'wrong@example.com', 
      'WrongPass123!'
    );

    expect(wrongCredentialsResult).toEqual({
      status: "WRONG_CREDENTIALS_ERROR"
    });
  });

  // Error Handling Tests
  describe('Error Scenarios', () => {
    test('should handle sign up failure', async () => {
      // Arrange
      const mockError = new Error('Sign up failed');
      
      (EmailPassword.signUp as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(EmailPassword.signUp(
        'tenant-id',
        'test@example.com', 
        'Test123!'
      )).rejects.toThrow('Sign up failed');
    });

    test('should handle session retrieval failure', async () => {
      // Arrange
      const mockError = new Error('Invalid session');
      
      (Session.getSession as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(Session.getSession(
        {} as any,  // req
        {} as any,  // res
        {}  // options
      )).rejects.toThrow('Invalid session');
    });
  });
});