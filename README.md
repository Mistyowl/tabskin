# Tabskin

**[README.ru.md](README.ru.md)**

**Русская версия**: Tabskin — это расширение для браузера, которое заменяет стандартную вкладку на минималистичную страницу с меняющимся фоном, текущим временем и информацией об авторе изображения. Оно использует случайные изображения высокого качества из Unsplash, предлагая настройки тем, автоматическую смену фона и плавные переходы.

**Tabskin** is a browser extension that replaces the standard new tab with a minimalistic page featuring a changing background, current time, and information about the image author. It uses high-quality random images from Unsplash, offering theme settings, automatic background switching, and smooth transitions. The extension supports multiple languages and is designed with lightness and ease of use in mind.

## Features

- Displays a high-quality random image from Unsplash on each new tab.
- Supports multiple themes for image selection (e.g., nature, architecture, space).
- Automatic background switching at user-defined intervals.
- Smooth transitions between images with a fade effect.
- Displays the current time on the page.
- Provides links to the photographer's profile and the image page on Unsplash.
- A settings modal for personalization.
- Localization support for English and Russian.
- Image caching to reduce API requests and improve performance.

## Installation for Developers

1. Clone the repository:
   ```bash
   git clone https://github.com/Mistyowl/tabskin.git
   ```

2. Navigate to the project directory:
   ```bash
   cd tabskin
   ```

3. Ensure you have Node.js version 20 or higher installed.

4. Install server dependencies:
   ```bash
   npm install
   ```

5. Create a `.env` file in the root directory with the following content:
   ```env
   UNSPLASH_KEY=your_unsplash_api_key
   PORT=8000
   CACHE_TTL=43200000
   ```
   Replace `your_unsplash_api_key` with your actual Unsplash API key.

6. Start the server using the command:
   ```bash
   nohup node server.js > proxy.log 2>&1 &
   ```
   This command runs the server in the background and saves logs to `proxy.log`.

7. Load the extension in your browser:
   - **For Chrome:**
     - Go to `chrome://extensions/`
     - Enable "Developer mode"
     - Click "Load unpacked" and select the `tabskin` directory
   - **For Firefox:**
     - Go to `about:debugging#/runtime/this-firefox`
     - Click "Load Temporary Add-on" and select the `manifest.json` file in the `tabskin` directory

## Usage

After installation, Tabskin automatically replaces the new tab page. You can:

- Click the refresh button to load a new background image.
- Click the settings button to open the settings modal.
- View the current time displayed on the page.
- Click on the photographer's name or the image link to visit their Unsplash profile or the image page.

## Configuration

### Server Configuration

- `UNSPLASH_KEY`: Your Unsplash API access key.
- `PORT`: The port on which the server runs (default: 3000).
- `CACHE_TTL`: Cache time-to-live in milliseconds (default: 43200000 ms or 12 hours).

### Extension Settings

- **Theme**: Choose the category of images to display (e.g., wallpapers, nature, space).
- **Auto Switch**: Enable or disable automatic background switching.
- **Switch Interval**: Set the interval for automatic background switching (in minutes).
- **Transition**: Enable or disable smooth transitions between images.

Settings are saved locally in the browser's storage.

## Development

To make changes to the extension:

1. Edit the source files in the `tabskin` directory.
2. Reload the extension in your browser:
   - **For Chrome:** Go to `chrome://extensions/` and click "Reload" for the Tabskin extension.
   - **For Firefox:** Go to `about:debugging#/runtime/this-firefox`, remove the temporary add-on, and load it again.
3. To run the server with automatic restarts on file changes, use `nodemon`:
   ```bash
   npm install -g nodemon
   nodemon server.js
   ```
4. Ensure the server is running and accessible at `http://localhost:3000/photos`.
5. Update `IMAGE_API_ENDPOINT` in `script.js` if the server is running on a different port or host.

## Contribution Guide

If you want to help with the development of Tabskin, follow these steps:

1. **Create a fork of the repository**:
   - Go to the repository page and click "Fork" in the upper right corner.

2. **Clone your fork**:
   ```bash
   git clone https://github.com/Mistyowl/tabskin.git
   ```

3. **Create a new branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature
   ```

4. **Make changes** and commit them:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push the branch to your fork**:
   ```bash
   git push origin feature/your-feature
   ```

6. **Open a pull request**:
   - Go to your fork's page on GitHub.
   - Click "Compare & pull request".
   - Fill out the pull request form using the following template:

   ### Pull Request Template

   **Title**: Brief description of your feature or fix

   **Description**:
   - What did you add or fix?
   - Why is this important?

   **Screenshots** (if applicable):
   - Attach screenshots demonstrating your changes.

   **Testing**:
   - How did you test your changes?
   - Are there any known issues?

7. **Wait for review**:
   - The project developers will review your pull request and may request additional changes.

Ensure your code adheres to the project's standards and includes necessary tests.