import * as fs from 'fs/promises';
import * as path from 'path';
import * as BaseUI from '../src/ui-kit/base.ui-kit';
import * as EcommerceUI from '../src/ui-kit/ecommerce.ui-kit';

// 1. Define the stories for each component

const stories = {
  'Base UI Kit': [
    {
      title: 'WelcomeMessage',
      component: () => BaseUI.WelcomeMessage({ title: 'Welcome!', subtitle: 'This is a subtitle.' }),
    },
    {
      title: 'SuccessMessage',
      component: () => BaseUI.SuccessMessage({ title: 'Operation Successful', details: 'Your file has been uploaded.' }),
    },
    {
      title: 'ErrorMessage',
      component: () => BaseUI.ErrorMessage({ error: 'Action Failed', suggestion: 'Please try again later.' }),
    },
    {
      title: 'BulletedList',
      component: () => BaseUI.BulletedList({ items: ['Apple', 'Banana', 'Cherry'] }),
    },
    {
      title: 'InfoPanel',
      component: () => BaseUI.InfoPanel({ keyValues: { 'User ID': 'usr_123', 'Status': 'Active', 'Plan': 'Premium' } }),
    },
  ],
  'E-commerce UI Kit': [
    {
        title: 'ProductCard',
        component: () => EcommerceUI.ProductCard({ name: 'Super VPN', price: 9.99, description: 'The best VPN in the world.' }),
    },
    {
        title: 'ShoppingCart',
        component: () => EcommerceUI.ShoppingCart({ items: [{name: 'Super VPN', quantity: 1}, {name: 'Mega VPN', quantity: 2}], total: 189.97 }),
    },
    {
        title: 'OrderStatus',
        component: () => EcommerceUI.OrderStatus({ orderId: 'ord_456', status: 'Shipped', estimatedDelivery: '2025-10-10' }),
    }
  ]
};

// 2. The generator function

async function generateStorybook() {
  try {
    const templatePath = path.join(__dirname, 'template.html');
    const outputPath = path.join(__dirname, 'output', 'index.html');

    let template = await fs.readFile(templatePath, 'utf-8');
    let storiesHtml = '';

    for (const category in stories) {
      storiesHtml += `<div class="story-category"><h2>${category}</h2>`;
      for (const story of stories[category]) {
        const componentResult = story.component();
        const renderedText = componentResult.text.replace(/\n/g, '<br />');
        storiesHtml += `
          <div class="story">
            <h3>${story.title}</h3>
            <div class="message-bubble">
              ${renderedText}
            </div>
          </div>
        `;
      }
      storiesHtml += `</div>`;
    }

    const finalHtml = template.replace('<!-- STORIES -->', storiesHtml);
    await fs.writeFile(outputPath, finalHtml);

    console.log(`✅ Storybook generated successfully at ${outputPath}`);

  } catch (error) {
    console.error('❌ Failed to generate storybook:', error);
  }
}

generateStorybook();
