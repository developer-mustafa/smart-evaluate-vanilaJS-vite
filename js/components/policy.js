// js/components/policy.js

// Dependencies
let stateManager, uiManager, helpers, app;

// DOM Elements
const elements = {};

// --- Policy Content ---
// This data is based on your PDF slides (pages 21-24)
// You can edit this array to change the policy content.
const policyData = [
  {
    title: '১. টিম গঠন (Team Formation)',
    icon: 'fas fa-users-cog',
    content: `
            <ul class="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                [cite_start]<li>প্রতি গ্রুপে ৪-৬ জন শিক্ষার্থী থাকবে (আদর্শ ৫ জন)। [cite: 158]</li>
                [cite_start]<li>ছেলে শিক্ষার্থী দিয়ে ছেলেদের একাধিক গ্রুপ ও মেয়েদের দিয়ে একাধিক গ্রুপ হবে। [cite: 159]</li>
                [cite_start]<li>প্রতিটি শিক্ষার্থীর ১ টি করে গ্রুপ দায়িত্ব থাকবে। [cite: 159]</li>
                [cite_start]<li>গ্রুপ স্টাডি সহজে করতে ১ বেঞ্চে একই গ্রুপের ৫ জন সদস্য বসার চেষ্টা করতে হবে। [cite: 160]</li>
            </ul>
        `,
  },
  {
    title: '২. দায়িত্ব বণ্টন (Role Distribution)',
    icon: 'fas fa-sitemap',
    content: `
            <h5 class="font-semibold text-gray-700 dark:text-white mb-2">প্রধান দায়িত্বসমূহ:</h5>
            <ul class="list-disc list-inside space-y-3 text-gray-600 dark:text-gray-400">
                [cite_start]<li><strong>টিম লিডার (টিমের প্রধান):</strong> নেতৃত্ব দেওয়া, সদস্যদের সাথে নিয়মিত যোগাযোগ রাখা, শিক্ষকদের সাথে সহযোগিতা চাওয়া, এবং দায়িত্ব পর্যবেক্ষণ করা। [cite: 175, 176, 177]</li>
                [cite_start]<li><strong>টাইম কিপার (সময় নিয়ন্ত্রক):</strong> বাড়ির কাজের তদারকি করা, সময়মতো অংশগ্রহণ নিশ্চিত করা, এবং সাপ্তাহিক উপস্থিতির পরিসংখ্যান তৈরী করা। [cite: 179, 180, 181]</li>
                [cite_start]<li><strong>রিসোর্স ম্যানেজার (ডকুমেন্ট সংরক্ষক):</strong> সকল পরীক্ষার শীট, নোটস ও রিপোর্ট রেকর্ড সংরক্ষণ করা, এবং ফলাফল অনুযায়ী সদস্যদের সতর্ক করা। [cite: 190, 191, 192]</li>
                [cite_start]<li><strong>রিপোর্টার (উপস্থাপক):</strong> গ্রুপের কাজের রিপোর্ট রাখা, অনুপস্থিত সদস্যের দায়িত্ব পালন করা, এবং যেকোনো অনুষ্ঠানে উপস্থাপনার দায়িত্ব পালন করা। [cite: 194, 195, 196]</li>
                [cite_start]<li><strong>পিস মেকার (শৃঙ্খলা নিয়ন্ত্রক):</strong> ক্লাসের ও টিমের শৃঙ্খলা বজায় রাখা, মত-বিরোধ বিষয়ে পরামর্শে শান্তি নিশ্চিত করা, এবং সদস্যদের উৎসাহ প্রদান করা। [cite: 203, 204, 205, 206]</li>
            </ul>
        `,
  },
  {
    title: '৩. মূল্যায়ন পদ্ধতি (Evaluation System)',
    icon: 'fas fa-clipboard-check',
    content: `
            <p class="text-gray-600 dark:text-gray-400 mb-4">প্রতিটি টাস্কের মূল্যায়ন নিম্নলিখিত খাতগুলোর উপর ভিত্তি করে হবে (মোট ১০০ নম্বর):</p>
            <ul class="list-decimal list-inside space-y-2 font-medium">
                [cite_start]<li>এসাইনমেন্ট / টাস্ক নম্বর: <strong class="text-blue-600 dark:text-blue-400">২০ নম্বর</strong> [cite: 215]</li>
                [cite_start]<li>টিম নম্বর: <strong class="text-purple-600 dark:text-purple-400">১৫ নম্বর</strong> [cite: 217]</li>
                <li>MCQ নম্বর: <strong class="text-green-600 dark:text-green-400">৪০ নম্বর</strong> (শিক্ষক কর্তৃক নির্ধারিত)</li>
                [cite_start]<li>অতিরিক্ত ক্রাইটেরিয়া: <strong class="text-orange-600 dark:text-orange-400">২৫ নম্বর</strong> [cite: 214]</li>
            </ul>
            <h5 class="font-semibold text-gray-700 dark:text-white mt-4 mb-2">অতিরিক্ত ক্রাইটেরিয়া ব্রেকডাউন (সর্বোচ্চ ২৫):</h5>
            <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                [cite_start]<li>ভালো করে শিখেছি: +১০ নম্বর [cite: 228]</li>
                [cite_start]<li>শুধু বুঝেছি: +৫ নম্বর [cite: 227]</li>
                [cite_start]<li>এখনো এই টপিক পারিনা: -৫ নম্বর [cite: 227]</li>
                [cite_start]<li>সাপ্তাহিক নিয়মিত উপস্থিতি: +১০ নম্বর [cite: 231]</li>
                [cite_start]<li>সপ্তাহে প্রতিদিন বাড়ির কাজ করেছি: +৫ নম্বর [cite: 230]</li>
            </ul>
        `,
  },
  {
    title: '৪. র‍্যাঙ্কিং ও পুরস্কার (Ranking & Rewards)',
    icon: 'fas fa-trophy',
    content: `
            <ul class="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                [cite_start]<li>কমপক্ষে ২টি মূল্যায়নে অংশগ্রহণকারী শিক্ষার্থীদের গড় স্কোরের ভিত্তিতে র‍্যাঙ্কিং করা হবে। [cite: 284]</li>
                <li>স্কোর সমান হলে, যে বেশি সংখ্যক মূল্যায়নে অংশ নিয়েছে সে এগিয়ে থাকবে।</li>
                [cite_start]<li>গ্রুপ ভিত্তিক র‍্যাঙ্কিং করা হবে এবং সেরা ৩টি গ্রুপকে মাসিক পুরস্কার দেওয়া হবে। [cite: 248, 287]</li>
                [cite_start]<li>সেরা টপ ১০ শিক্ষার্থীকে বিশেষ মূল্যায়ন ও পুরস্কৃত করা হবে। [cite: 249, 287]</li>
                [cite_start]<li>প্রতি এসাইনমেন্টের ফলাফল পরবর্তী র‍্যাঙ্কিংয়ে প্রভাব ফেলবে। [cite: 288]</li>
            </ul>
        `,
  },
];

/**
 * Initializes the Policy component.
 * @param {object} dependencies - Passed from app.js.
 * @returns {object} - Public methods.
 */
export function init(dependencies) {
  uiManager = dependencies.managers.uiManager;
  // No other dependencies needed for this static component

  _cacheDOMElements();
  _setupEventListeners();

  console.log('✅ Policy component initialized.');

  return {
    render,
  };
}

/**
 * Renders the Policy page (#page-group-policy).
 * This function builds the policy sections dynamically from the `policyData` array.
 */
export function render() {
  if (!elements.page) {
    console.error('❌ Policy render failed: Page element #page-group-policy not found.');
    return;
  }
  console.log('Rendering Group Policy page...');

  if (!elements.policySectionsContainer) {
    console.error('❌ Policy render failed: #policySections container not found.');
    uiManager.displayEmptyMessage(elements.page, 'পলিসি কন্টেইনার খুঁজে পাওয়া যায়নি।');
    return;
  }

  uiManager.clearContainer(elements.policySectionsContainer); // Clear previous content

  if (!policyData || policyData.length === 0) {
    uiManager.displayEmptyMessage(elements.policySectionsContainer, 'কোনো পলিসি তথ্য যোগ করা হয়নি।');
    return;
  }

  let html = '';
  policyData.forEach((section, index) => {
    html += `
            <div classclass="card overflow-hidden">
                <button 
                    class="policy-header w-full flex justify-between items-center p-4 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onclick="window.smartEvaluator.components.policy.togglePolicySection(${index})"
                    aria-expanded="false"
                    aria-controls="policyContent-${index}"
                >
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                        <i class="${section.icon || 'fas fa-shield-alt'} w-6 text-center mr-3 text-blue-500"></i>
                        ${helpers.ensureBengaliText(section.title)}
                    </h4>
                    <i id="policyIcon-${index}" class="fas fa-chevron-down text-gray-500 dark:text-gray-400 transition-transform duration-300"></i>
                </button>
                
                <div id="policyContent-${index}" class="policy-content hidden p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div class="prose prose-sm dark:prose-invert max-w-none">
                         ${section.content} </div>
                </div>
            </div>
        `;
  });

  elements.policySectionsContainer.innerHTML = html;

  // Expose toggle function globally via app instance
  if (!window.smartEvaluator.components) window.smartEvaluator.components = {};
  window.smartEvaluator.components.policy = { togglePolicySection };
}

/**
 * Caches DOM elements for the Policy page.
 * @private
 */
function _cacheDOMElements() {
  elements.page = document.getElementById('page-group-policy');
  if (elements.page) {
    elements.policySectionsContainer = elements.page.querySelector('#policySections');
  } else {
    console.warn('Policy page element (#page-group-policy) not found!');
  }
}

/**
 * Sets up event listeners for the Policy page.
 * (Using onclick in render() for simplicity, but could use delegation)
 * @private
 */
function _setupEventListeners() {
  // Event delegation could be used here instead of inline onclick
  // uiManager.addListener(elements.policySectionsContainer, 'click', (e) => {
  //     const header = e.target.closest('.policy-header');
  //     if (header) {
  //         const index = header.dataset.index; // Would need to add data-index attribute
  //         togglePolicySection(index);
  //     }
  // });
}

/**
 * Toggles the visibility of a policy section (accordion).
 * This function is exposed globally via `window.smartEvaluator.components.policy.togglePolicySection`
 * @param {number} index - The index of the section to toggle.
 */
export function togglePolicySection(index) {
  const content = document.getElementById(`policyContent-${index}`);
  const icon = document.getElementById(`policyIcon-${index}`);
  if (content && icon) {
    const isHidden = content.classList.contains('hidden');
    content.classList.toggle('hidden', !isHidden);
    icon.classList.toggle('rotate-180', isHidden);

    // Update ARIA attribute
    const button = content.previousElementSibling; // Get the button
    button?.setAttribute('aria-expanded', String(isHidden));
  }
}
