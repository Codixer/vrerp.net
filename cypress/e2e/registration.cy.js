describe("registration", () => {
  it("registers a new user", () => {
    cy.visit("http://localhost:5080/");
    // cy.get('.track-login-btn').click();
    cy.visit("http://localhost:5080/api/discord/auth?code=testingcode");
    cy.wait(100);
    //cy.get('button');
    // cy.get('.drac-btn').click();
    cy.get("#agreeRules").click();
    cy.get("button").contains("Next").click();
    cy.intercept("**/api/profiles/*").as("profileUpdate");
    const fileName = "profile-image-0.jpg";
    cy.fixture(fileName, "binary")
      .then(Cypress.Blob.binaryStringToBlob)
      .then((fileContent) => {
        console.log("fileContent", fileContent);
        console.log("fileName", fileName);
        cy.get(".avatar > input").attachFile({
          fileContent,
          fileName: "image0.jpg",
          mimeType: "image/jpeg",
        });
      });
    cy.wait("@profileUpdate");
  });
});
