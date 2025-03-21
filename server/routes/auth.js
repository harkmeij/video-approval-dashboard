const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');
const { hashPassword, comparePassword, generateResetToken, hashToken } = require('../utils/passwordUtils');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'client'
      }
    });
    
    if (authError) {
      console.error('Supabase Auth error:', authError);
      throw authError;
    }
    
    // Hash the password for our users table
    const hashedPassword = await hashPassword(password);
    
    // Create new user in users table
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.user.id, // Use the ID from Supabase Auth
          email,
          name,
          password: hashedPassword,
          role: 'client',
          active: true
        }
      ])
      .select();
    
    if (createError) throw createError;
    
    // Create and return JWT token
    const payload = {
      user: {
        id: newUser[0].id,
        role: newUser[0].role
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: newUser[0].id, 
            name: newUser[0].name, 
            email: newUser[0].email, 
            role: newUser[0].role 
          } 
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    
    // Check if it's a Supabase error
    if (err.code) {
      return res.status(500).json({ 
        message: 'Database error during registration', 
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // First try to authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (authError) {
      // If Supabase Auth fails, check if it's a legacy user in our users table
      console.log('Supabase Auth login failed, trying legacy login:', authError.message);
      
      // Check if user exists in our users table
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);
      
      if (error) throw error;
      
      if (!users || users.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const user = users[0];
      
      // Check if user is active
      if (!user.active) {
        return res.status(400).json({ message: 'Account not activated. Please check your email.' });
      }
      
      // Check password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Create and return JWT token
      const payload = {
        user: {
          id: user.id,
          role: user.role
        }
      };
      
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1d' },
        (err, token) => {
          if (err) throw err;
          res.json({ 
            token, 
            user: { 
              id: user.id, 
              name: user.name, 
              email: user.email, 
              role: user.role 
            } 
          });
        }
      );
      
      return;
    }
    
    // If Supabase Auth succeeds, get the user from our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (userError) throw userError;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }
    
    // Check if user is active
    if (!user.active) {
      return res.status(400).json({ message: 'Account not activated. Please check your email.' });
    }
    
    // Create and return JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          } 
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    
    // Check if it's a Supabase error
    if (err.code) {
      return res.status(500).json({ 
        message: 'Database error during login', 
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error during login', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   POST /api/auth/invite
// @desc    Invite a new user by sending an email with a password setup link
// @access  Private (Editor only)
router.post('/invite', verifyToken, async (req, res) => {
  // Check if user is an editor
  if (req.user.role !== 'editor') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  const { email, name, role, website_url, keywords, location } = req.body;
  
  let authUser = null;
  let resetToken = null;
  let hashedToken = null;
  
  try {
    console.log('Starting user invitation process for:', email);
    
    // Check if user already exists in our users table
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing user in users table:', checkError);
      throw checkError;
    }
    
    // Also check if the user exists in Supabase Auth
    const { data: existingAuth, error: authCheckError } = await supabase.auth.admin.listUsers({
      filter: {
        email: email
      }
    });
    
    if (authCheckError) {
      console.error('Error checking existing user in Supabase Auth:', authCheckError);
      throw authCheckError;
    }
    
    const userExistsInAuth = existingAuth.users && existingAuth.users.length > 0;
    const userExistsInTable = existingUsers && existingUsers.length > 0;
    
    if (userExistsInTable) {
      return res.status(400).json({ message: 'User already exists in the system.' });
    }
    
    // If user exists in Auth but not in our table, they might have been deleted from our table
    // We can delete them from Auth and recreate them
    if (userExistsInAuth && !userExistsInTable) {
      console.log('User exists in Auth but not in users table. Deleting from Auth...');
      const authUser = existingAuth.users[0];
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
      
      if (deleteError) {
        console.error('Error deleting existing user from Auth:', deleteError);
        return res.status(400).json({ message: 'User already exists in authentication system and could not be reset.' });
      }
      
      console.log('Successfully deleted user from Auth to allow recreation');
    }
    
    // Generate password reset token for our custom users table
    const tokenData = generateResetToken();
    resetToken = tokenData.resetToken;
    hashedToken = tokenData.hashedToken;
    const expires = tokenData.expires;
    
    console.log('Generated reset token for:', email);
    
    // Create new user in Supabase Auth
    const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true, // Changed to true to avoid email verification issues
      user_metadata: {
        name: name,
        role: role || 'client'
      }
    });
    
    if (authError) {
      console.error('Supabase Auth error:', authError);
      throw authError;
    }
    
    authUser = newAuthUser;
    console.log('Created user in Supabase Auth:', authUser.user.id);
    
    // Create new user in users table
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.user.id,
          email,
          name,
          role: role || 'client',
          active: false,
          password_reset_token: hashedToken,
          password_reset_expires: expires,
          // Add new client profile fields if provided
          website_url: website_url || null,
          keywords: keywords || [],
          location: location || null
        }
      ])
      .select();
    
    if (createError) {
      console.error('Error creating user in users table:', createError);
      throw createError;
    }
    
    console.log('Created user in users table:', newUser[0].id);
    
    // Send email - try Supabase first, then fall back to nodemailer
    let emailSent = false;
    
    try {
      console.log('Attempting to send invitation email via Supabase...');
      
      // Try to send invitation email using Supabase Auth with proper invitation type
      console.log('Attempting to send invitation with proper invite type...');
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
          redirectTo: `${process.env.CLIENT_URL}/setup-password/${resetToken}`,
          data: {
            name: name,
            role: role || 'client'
          }
        }
      });
      
      if (inviteError) {
        console.error('Supabase invitation error:', inviteError);
        console.error('Error code:', inviteError.code || 'no code');
        console.error('Error message:', inviteError.message || 'no message');
        throw inviteError;
      }
      
      emailSent = true;
      console.log('Supabase invitation email sent successfully', inviteData ? 'with data' : 'without data');
    } catch (emailError) {
      console.error('Supabase email sending failed:', emailError);
      console.log('Falling back to custom email sending...');
      
      try {
        // Create password setup URL
        const resetUrl = `${process.env.CLIENT_URL}/setup-password/${resetToken}`;
        
        // Send email using nodemailer with improved template
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Account Invitation - Video Approval Dashboard',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4a6cf7; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
                .button { display: inline-block; background-color: #4a6cf7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin: 20px 0; }
                .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to the Video Approval Dashboard</h1>
                </div>
                <div class="content">
                  <p>Hello ${name},</p>
                  <p>You have been invited to join the Video Approval Dashboard as a <strong>${role || 'client'}</strong>.</p>
                  <p>Our platform allows you to:</p>
                  <ul>
                    <li>View and approve videos</li>
                    <li>Provide feedback through comments</li>
                    <li>Access your content securely</li>
                  </ul>
                  <p>Please click the button below to set up your password and activate your account:</p>
                  <a href="${resetUrl}" class="button" target="_blank">Set Up Your Password</a>
                  <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
                  <p>If you have any questions, please contact your account manager.</p>
                </div>
                <div class="footer">
                  <p>If you did not request this invitation, please ignore this email.</p>
                  <p>© ${new Date().getFullYear()} Video Approval Dashboard. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
        };
        
        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log('Custom email sent successfully');
      } catch (nodemailerError) {
        console.error('Nodemailer error:', nodemailerError);
        // We don't throw here because the user was created successfully
      }
    }
    
    // Return success even if email failed, since user was created
    if (emailSent) {
      res.json({ message: 'Invitation sent successfully' });
    } else {
      // User was created but no email was sent
      res.json({ 
        message: 'User created successfully, but invitation email could not be sent. Please provide the setup link manually.',
        setupLink: `${process.env.CLIENT_URL}/setup-password/${resetToken}`
      });
    }
  } catch (err) {
    console.error('Invite error:', err);
    
    // Check if it's a Supabase error
    if (err.code) {
      return res.status(500).json({ 
        message: 'Database error during invitation: ' + err.message, 
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error during invitation: ' + err.message, 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   POST /api/auth/setup-password
// @desc    Set up password for a new user
// @access  Public
router.post('/setup-password', async (req, res) => {
  const { token, password } = req.body;
  
  try {
    // Hash the token from the URL
    const hashedToken = hashToken(token);
    
    // Find user with the token and check if it's expired
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', hashedToken)
      .gt('password_reset_expires', new Date().toISOString())
      .limit(1);
    
    if (error) throw error;
    
    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }
    
    const user = users[0];
    
    // Hash the new password
    const hashedPassword = await hashPassword(password);
    
    // Update password in Supabase Auth
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    );
    
    if (authUpdateError) {
      console.error('Supabase Auth update error:', authUpdateError);
      throw authUpdateError;
    }
    
    // Update user with new password and activate account
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
        active: true
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (err) {
    console.error('Setup password error:', err);
    
    // Check if it's a Supabase error
    if (err.code) {
      return res.status(500).json({ 
        message: 'Database error during password setup', 
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error during password setup', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Find user by email
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);
    
    if (error) throw error;
    
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Generate password reset token for our custom users table
    const { resetToken, hashedToken, expires } = generateResetToken();
    
    // Update user with reset token in our custom users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_reset_token: hashedToken,
        password_reset_expires: expires
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    try {
      // Try to send password reset email using Supabase Auth
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.CLIENT_URL}/reset-password/${resetToken}`
        }
      });
      
      if (resetError) {
        throw resetError;
      }
      
      console.log('Supabase password reset email sent successfully');
    } catch (emailError) {
      console.error('Supabase password reset error:', emailError);
      console.log('Falling back to custom email sending...');
      
      // Create password reset URL
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      
      // Send email using nodemailer with improved template
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset - Video Approval Dashboard',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4a6cf7; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
              .button { display: inline-block; background-color: #4a6cf7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin: 20px 0; }
              .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset</h1>
              </div>
              <div class="content">
                <p>Hello ${user.name},</p>
                <p>You requested a password reset for your Video Approval Dashboard account.</p>
                <p>Please click the button below to reset your password:</p>
                <a href="${resetUrl}" class="button" target="_blank">Reset Your Password</a>
                <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
                <p>If you did not request this reset, please ignore this email and ensure your account is secure.</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>© ${new Date().getFullYear()} Video Approval Dashboard. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      try {
        await transporter.sendMail(mailOptions);
        console.log('Custom password reset email sent successfully');
      } catch (nodemailerError) {
        console.error('Nodemailer error:', nodemailerError);
        // We don't throw here because the token was created successfully
        // Just log the error and continue
      }
    }
    
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    
    // Check if it's a Supabase error
    if (err.code) {
      return res.status(500).json({ 
        message: 'Database error during forgot password', 
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error during forgot password', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  
  try {
    // Hash the token from the URL
    const hashedToken = hashToken(token);
    
    // Find user with the token and check if it's expired
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', hashedToken)
      .gt('password_reset_expires', new Date().toISOString())
      .limit(1);
    
    if (error) throw error;
    
    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }
    
    const user = users[0];
    
    // Hash the new password
    const hashedPassword = await hashPassword(password);
    
    // Update password in Supabase Auth
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    );
    
    if (authUpdateError) {
      console.error('Supabase Auth update error:', authUpdateError);
      throw authUpdateError;
    }
    
    // Update user with new password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    
    // Check if it's a Supabase error
    if (err.code) {
      return res.status(500).json({ 
        message: 'Database error during password reset', 
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error during password reset', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, active, created_at, website_url, keywords, location')
      .eq('id', req.user.id)
      .limit(1)
      .single();
    
    if (error) throw error;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    
    // Check if it's a Supabase error
    if (err.code) {
      return res.status(500).json({ 
        message: 'Database error retrieving user', 
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error retrieving user', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
// Export verifyToken middleware for use in other routes
module.exports.verifyToken = verifyToken;
