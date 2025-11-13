import { useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Lock, Building, User, Briefcase, Shield, Send, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  permissions: string;
}

const UserRegistration = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    department: '',
    role: 'user',
    permissions: 'standard'
  });

  const [resetEmail, setResetEmail] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateRandomPassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        role: formData.role,
        permissions: formData.permissions,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || 'admin',
        active: true
      });

      setSuccessMessage(`User created successfully! Email: ${formData.email}, Password: ${formData.password}`);

      toast({
        title: "User Created Successfully",
        description: `${formData.firstName} ${formData.lastName} has been added to the system.`,
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        department: '',
        role: 'user',
        permissions: 'standard'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      setErrorMessage(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccessMessage(`Password reset email sent to ${resetEmail}`);
      toast({
        title: "Password Reset Email Sent",
        description: `Check ${resetEmail} for reset instructions.`,
      });
      setResetEmail('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset email';
      setErrorMessage(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          User Management
        </CardTitle>
        <CardDescription>
          Create new users or reset passwords for existing users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New User</TabsTrigger>
            <TabsTrigger value="reset">Reset Password</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    <User className="inline-block h-4 w-4 mr-1" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    <User className="inline-block h-4 w-4 mr-1" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline-block h-4 w-4 mr-1" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="inline-block h-4 w-4 mr-1" />
                  Password
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    name="password"
                    type="text"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter password"
                  />
                  <Button type="button" variant="outline" onClick={generateRandomPassword}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">
                    <Building className="inline-block h-4 w-4 mr-1" />
                    Department
                  </Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Lastensuojelu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">
                    <Briefcase className="inline-block h-4 w-4 mr-1" />
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissions">
                  <Shield className="inline-block h-4 w-4 mr-1" />
                  Permissions
                </Label>
                <Select value={formData.permissions} onValueChange={(value) => handleSelectChange('permissions', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Access</SelectItem>
                    <SelectItem value="elevated">Elevated Access</SelectItem>
                    <SelectItem value="full">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {successMessage && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isLoading ? 'Creating User...' : 'Create User'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="reset" className="space-y-4">
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">
                  <Mail className="inline-block h-4 w-4 mr-1" />
                  User Email Address
                </Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="user@valmet.com"
                />
              </div>

              {successMessage && activeTab === 'reset' && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {errorMessage && activeTab === 'reset' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? 'Sending Reset Email...' : 'Send Password Reset Email'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserRegistration;