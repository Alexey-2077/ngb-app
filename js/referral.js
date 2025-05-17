window.ReferralSystem = {
  generateRefLink() {
    const userId = localStorage.getItem('userId') || this.generateUserId();
    const refCode = btoa(userId).replace(/=/g, '');
    return `${window.location.origin}?ref=${refCode}`;
  },

  generateUserId() {
    const userId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('userId', userId);
    return userId;
  },

  validateRefCode(refCode) {
    try {
      return atob(refCode);
    } catch {
      return false;
    }
  },

  checkAccess() {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    const hasAccess = localStorage.getItem('hasAccess');
    
    if (hasAccess || (refCode && this.validateRefCode(refCode))) {
      localStorage.setItem('hasAccess', 'true');
      return true;
    }
    return false;
  }
};
