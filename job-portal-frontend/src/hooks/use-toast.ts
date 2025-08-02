import toast from 'react-hot-toast';

// Since you're already using react-hot-toast in layout.tsx, let's create a compatible hook
export const useToast = () => {
  return {
    toast: (options: { title: string; description?: string; variant?: 'destructive' | 'default' }) => {
      if (options.variant === 'destructive') {
        toast.error(options.title + (options.description ? '\n' + options.description : ''));
      } else {
        toast.success(options.title + (options.description ? '\n' + options.description : ''));
      }
    }
  };
};
