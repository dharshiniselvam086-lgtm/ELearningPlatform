function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCourseId");
    localStorage.removeItem("quizScore");
    localStorage.removeItem("quizTotal");

    window.location.href = "login.html";
}