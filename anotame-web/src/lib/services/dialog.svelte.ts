export const confirmDialog = new class {
  open = $state(false);
  title = $state('');
  description = $state('');
  private resolveFn: ((v: boolean) => void) | null = null;

  async prompt(title: string, description: string = ''): Promise<boolean> {
    // Mobile fallback (native block)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        const msg = description ? `${title}\n\n${description}` : title;
        return window.confirm(msg);
    }

    // Desktop Custom AlertDialog
    this.title = title;
    this.description = description;
    this.open = true;
    
    return new Promise(resolve => {
      this.resolveFn = resolve;
    });
  }

  confirm() {
    this.open = false;
    if (this.resolveFn) {
        this.resolveFn(true);
        this.resolveFn = null;
    }
  }

  cancel() {
    this.open = false;
    if (this.resolveFn) {
        this.resolveFn(false);
        this.resolveFn = null;
    }
  }
}();
