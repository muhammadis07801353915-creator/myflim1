const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzvojposgvdjwriivryp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6dm9qcG9zZ3ZkandyaWl2cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjI0ODYsImV4cCI6MjA5MTYzODQ4Nn0.espsU_o7aQuzsOnvwBuVeOaYXdoATCpploiF-OPZnCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const filesToMigrate = [
    {
        filePath: 'c:\\Users\\muham\\Downloads\\Telegram Desktop\\settings_rows.csv',
        tableName: 'settings'
    },
    {
        filePath: 'c:\\Users\\muham\\Downloads\\Telegram Desktop\\movie_lists_rows.csv',
        tableName: 'movie_lists'
    },
    {
        filePath: 'c:\\Users\\muham\\Downloads\\Telegram Desktop\\channel_categories_rows.csv',
        tableName: 'channel_categories'
    },
    {
        filePath: 'c:\\Users\\muham\\Downloads\\channels_rows.csv',
        tableName: 'channels'
    },
    {
        filePath: 'c:\\Users\\muham\\Downloads\\Telegram Desktop\\promo_codes_rows.csv',
        tableName: 'promo_codes'
    },
    {
        filePath: 'c:\\Users\\muham\\Downloads\\Telegram Desktop\\banners_rows.csv',
        tableName: 'banners'
    },
    {
        filePath: 'c:\\Users\\muham\\Downloads\\Telegram Desktop\\movies_rows.csv',
        tableName: 'movies'
    }
];

const placeholderImage = 'https://via.placeholder.com/300x450?text=No+Image';

async function migrate() {
    console.log('--- دەستپێکردنی گواستنەوەی داتا ---');

    for (const file of filesToMigrate) {
        console.log(`\nخەریکی گواستنەوەی فایلی: ${file.filePath} بۆ ناو خشتەی: ${file.tableName}...`);
        
        if (!fs.existsSync(file.filePath)) {
            console.error(`سەرکەوتوو نەبوو: فایلەکە لەم شوێنەدا بوونی نییە: ${file.filePath}`);
            continue;
        }

        const rows = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(file.filePath)
                .pipe(csv())
                .on('data', (data) => {
                    // Clean Base64 images to prevent size issues
                    for (const key in data) {
                        if (data[key] && data[key].startsWith('data:image')) {
                            data[key] = placeholderImage;
                        }
                        // Handle empty strings
                        if (data[key] === '') data[key] = null;
                    }
                    rows.push(data);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (rows.length === 0) {
            console.log(`خشتەی ${file.tableName} هیچ داتایەکی تێدا نییە.`);
            continue;
        }

        // Split into chunks to avoid Supabase limits
        const chunkSize = 50;
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const { error } = await supabase.from(file.tableName).insert(chunk);
            if (error) {
                console.error(`کێشە لە خشتەی ${file.tableName} دروستبوو:`, error.message);
            } else {
                console.log(`بڕی ${chunk.length} ڕیز بە سەرکەوتوویی گواسترایەوە.`);
            }
        }
    }

    console.log('\n--- گواستنەوەی داتا بەسەرکەوتوویی کۆتایی هات ---');
}

migrate();
