# Sample Inventory Images

## About These Images

These images were captured from our own household pantry and refrigerator for testing the Smart Fridge Recipes application. By using real-world images from our kitchens, we ensured the AI vision model is tested against authentic, everyday scenarios.

## Testing Process

1. **Image Capture** – We photographed our fridges and pantry shelves with varying lighting conditions and angles to simulate real user behavior.

2. **Upload to App** – Each image was uploaded through the `/live/inventory` page to trigger the `manage-inventory` Kestra workflow.

3. **AI Analysis** – Gemini 2.5 Flash Vision API analyzed the images and extracted ingredient lists with quantities.

4. **Validation** – We manually verified the AI-detected items against what was actually in the fridge to measure accuracy.

5. **Recipe Generation** – Using the detected inventory, we tested recipe generation with different skill levels and dietary preferences.

## Why Real Images?

- Stock photos often have perfectly arranged, well-lit shelves
- Real fridges have overlapping items, partial visibility, and mixed lighting
- Testing with authentic images ensures the app works in real-world conditions

## Privacy Note

All images are from team members' personal households, shared with consent for development and demonstration purposes.
