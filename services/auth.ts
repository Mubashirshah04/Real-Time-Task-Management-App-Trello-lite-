
export const authService = {
  getUserId(): string {
    let userId = localStorage.getItem('trello_lite_user_id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('trello_lite_user_id', userId);
    }
    return userId;
  }
};
