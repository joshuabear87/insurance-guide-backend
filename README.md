BOOKSTORE Application (Backend)

A full-stack MERN application template for managing medical insurance plans, allowing staff to view, add, and update plans efficiently.

🔹 Frontend: React, Next.js, TailwindCSS
🔹 Backend: Node.js, Express.js
🔹 Database: MongoDB

Folders: 
controllers/
  authController.js 
middleware/
  authMiddleware.js
models/
  userModel.js
  bookModel.js
routes/
  authRoutes.js
  booksRoute.js
  userRoutes.js


Client (React app)
    |
    |-----> POST /auth/register       (Register new user)
    |-----> POST /auth/login           (Login and get JWT)
    |-----> POST /auth/forgot-password (Coming soon)
    |
    |-----> GET  /books                (List all books)
    |-----> POST /books/create         (Admin only: Create book)
    |-----> PUT  /books/edit/:id        (Admin only: Edit book)
    |-----> DELETE /books/delete/:id    (Admin only: Delete book)
    |
    |-----> GET  /users/profile         (View my profile)
    |-----> PUT  /users/profile         (Update my profile)
    |-----> GET  /users/                (Admin only: View all users)
    |-----> PUT  /users/approve/:id     (Admin only: Approve a user)
    |-----> PUT  /users/make-admin/:id  (Admin only: Promote to Admin)
