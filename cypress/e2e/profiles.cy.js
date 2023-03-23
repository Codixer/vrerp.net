describe("user profiles", () => {
  it("checks user profiles", () => {
    cy.visit("http://localhost:5080/");
    // cy.get('.track-login-btn').click();
    cy.visit("http://localhost:5080/api/discord/auth?code=testingcode");
    cy.wait(100);
  });
});
