
import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

const CreateAdminDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: 'Admin User'
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Invoking create-admin function...');
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: JSON.stringify(formData)
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success! Admin Created",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>You can now login as {formData.email}</span>
          </div>
        ),
        variant: "default", // Success variant sometimes not default in shadcn, using default with icon
      });

      setOpen(false);
      setFormData({ email: '', password: '', username: 'Admin User' });
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        variant: "destructive",
        title: "Failed to Create Admin",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-slate-500 hover:text-indigo-400 hover:bg-slate-800/50"
        >
          <ShieldAlert className="w-3 h-3 mr-1" />
          Dev: Create Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-400">
            <ShieldAlert className="h-5 w-5" />
            Create Admin User
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            This tool uses the Admin API (Edge Function) to create a user with elevated privileges.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreateAdmin} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Display Name</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Admin Name"
              className="bg-slate-950 border-slate-800"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              className="bg-slate-950 border-slate-800"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className="bg-slate-950 border-slate-800"
              required
              minLength={6}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Admin Account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdminDialog;
