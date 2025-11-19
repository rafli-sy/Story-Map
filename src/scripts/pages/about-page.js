export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1>About Page</h1>
        <p>Story App adalah ruang sederhana namun kuat untuk berbagi pengalaman, merekam momen penting, dan menemukan cerita dari orang lain.</p>
        <p>Kami percaya bahwa setiap orang memiliki kisah yang layak dibagikan—baik itu perjalanan, inspirasi, tantangan, maupun catatan keseharian yang penuh makna.</p>
      </section>
    `;
  }

  async afterRender() {
    // Do your job here
  }
}
