const axios = require('axios');
const xml2js = require('xml2js');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { convert } = require('html-to-text');

class JobApiService {
    constructor() {
        this.parser = new xml2js.Parser({
            explicitArray: false,
            ignoreAttrs: false,
            mergeAttrs: true
        });
    }

    static getApiEndpoints() {
        return [
            {
                name: 'jobicy-general',
                url: 'https://jobicy.com/?feed=job_feed',
                source: 'jobicy',
                description: 'General job feed'
            },
            {
                name: 'jobicy-smm-fulltime',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
                source: 'jobicy',
                description: 'Social Media Marketing full-time jobs'
            },
            {
                name: 'jobicy-seller-france',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
                source: 'jobicy',
                description: 'Sales jobs in France'
            },
            {
                name: 'jobicy-design',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
                source: 'jobicy',
                description: 'Design and multimedia jobs'
            },
            {
                name: 'jobicy-data-science',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=data-science',
                source: 'jobicy',
                description: 'Data science jobs'
            },
            {
                name: 'jobicy-copywriting',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
                source: 'jobicy',
                description: 'Copywriting jobs'
            },
            {
                name: 'jobicy-business',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=business',
                source: 'jobicy',
                description: 'Business jobs'
            },
            {
                name: 'jobicy-management',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=management',
                source: 'jobicy',
                description: 'Management jobs'
            },
            {
                name: 'higher-ed-jobs',
                url: 'https://www.higheredjobs.com/rss/articleFeed.cfm',
                source: 'higheredjobs',
                description: 'Higher education jobs'
            }
        ];
    }

    async fetchJobsFromApi(apiConfig) {
        try {
            logger.info(`🔄 Fetching jobs from ${apiConfig.name} (${apiConfig.url})`);

            const response = await axios.get(apiConfig.url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/xml, text/xml, application/rss+xml, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                }
            });

            // Log response details
            logger.info(`📄 Response from ${apiConfig.name}:`, {
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers['content-type'],
                contentLength: response.headers['content-length'],
                dataLength: response.data?.length || 0,
                firstChars: response.data?.substring(0, 500) || 'No data'
            });

            if (!response.data || response.data.length === 0) {
                throw new Error('Empty response from API');
            }

            // Check if response is valid XML
            if (!response.data.includes('<rss') && !response.data.includes('<?xml')) {
                logger.error(`❌ Invalid XML response from ${apiConfig.name}:`, response.data.substring(0, 200));
                throw new Error('Response is not valid XML');
            }

            const jsonData = await this.parser.parseStringPromise(response.data);

            // Log parsed structure
            logger.info(`📊 Parsed structure from ${apiConfig.name}:`, {
                hasRss: !!jsonData.rss,
                hasChannel: !!jsonData.rss?.channel,
                hasItem: !!jsonData.rss?.channel?.item,
                itemType: Array.isArray(jsonData.rss?.channel?.item) ? 'array' : 'object',
                itemCount: Array.isArray(jsonData.rss?.channel?.item) ?
                    jsonData.rss.channel.item.length :
                    (jsonData.rss?.channel?.item ? 1 : 0),
                channelKeys: jsonData.rss?.channel ? Object.keys(jsonData.rss.channel) : []
            });

            if (!jsonData.rss || !jsonData.rss.channel) {
                throw new Error('Invalid RSS structure - missing rss or channel');
            }

            let items = jsonData.rss.channel.item || [];

            // Ensure items is always an array
            if (!Array.isArray(items)) {
                items = [items];
            }

            logger.info(`✅ Successfully parsed ${items.length} items from ${apiConfig.name}`);

            return this.processJobItems(items, apiConfig);

        } catch (error) {
            logger.error(`❌ Error fetching jobs from ${apiConfig.name}:`, {
                message: error.message,
                code: error.code,
                response: error.response?.status,
                url: apiConfig.url
            });
            throw error;
        }
    }

    processJobItems(items, apiConfig) {
        const processedJobs = [];

        for (const item of items) {
            try {
                const processedJob = this.processJobItem(item, apiConfig);
                if (processedJob) {
                    processedJobs.push(processedJob);
                }
            } catch (error) {
                logger.warn(`⚠️ Failed to process job item from ${apiConfig.name}:`, {
                    error: error.message,
                    item: JSON.stringify(item).substring(0, 200)
                });
            }
        }

        logger.info(`📋 Processed ${processedJobs.length} valid jobs from ${apiConfig.name}`);
        return processedJobs;
    }

    processJobItem(item, apiConfig) {
        // Extract basic job information
        const title = this.extractText(item.title);
        const description = this.extractText(item.description || item.summary || item.content);
        const link = this.extractText(item.link || item.guid);
        const pubDate = this.extractText(item.pubDate || item.published);
        const category = this.extractText(item.category);
        const author = this.extractText(item.author || item['dc:creator']);

        // Skip if essential fields are missing
        if (!title || !link) {
            logger.warn(`⚠️ Skipping job item - missing title or link from ${apiConfig.name}`);
            return null;
        }

        // Extract additional fields based on source
        const additionalFields = this.extractSourceSpecificFields(item, apiConfig.source);

        // Create job object
        const job = {
            id: uuidv4(),
            title: title.trim(),
            description: this.cleanDescription(description),
            link: link.trim(),
            source: apiConfig.source,
            sourceApi: apiConfig.name,
            category: category || 'General',
            author: author || 'Unknown',
            publishedDate: this.parseDate(pubDate),
            fetchedAt: new Date().toISOString(),
            ...additionalFields
        };

        return job;
    }

    extractSourceSpecificFields(item, source) {
        const fields = {};

        switch (source) {
            case 'jobicy':
                fields.company = this.extractText(item.company || item['jobicy:company']);
                fields.location = this.extractText(item.location || item['jobicy:location']);
                fields.jobType = this.extractText(item.jobType || item['jobicy:job_type']);
                fields.salary = this.extractText(item.salary || item['jobicy:salary']);
                fields.tags = this.extractTags(item.tags || item['jobicy:tags']);
                break;

            case 'higheredjobs':
                fields.institution = this.extractText(item.institution || item['he:institution']);
                fields.department = this.extractText(item.department || item['he:department']);
                fields.jobLevel = this.extractText(item.jobLevel || item['he:job_level']);
                fields.applicationDeadline = this.extractText(item.deadline || item['he:deadline']);
                break;

            default:
                // Extract any custom fields that might be present
                Object.keys(item).forEach(key => {
                    if (!['title', 'description', 'link', 'pubDate', 'category', 'author'].includes(key)) {
                        fields[key] = this.extractText(item[key]);
                    }
                });
        }

        return fields;
    }

    extractText(value) {
        if (!value) return '';

        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'object') {
            // Handle CDATA or nested objects
            if (value._) {
                return value._;
            }
            if (value.$) {
                return value.$.href || value.$.url || '';
            }
            return JSON.stringify(value);
        }

        return String(value);
    }

    extractTags(tagsValue) {
        if (!tagsValue) return [];

        const tagsText = this.extractText(tagsValue);
        if (!tagsText) return [];

        // Split by common separators
        return tagsText.split(/[,;|]/)
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    cleanDescription(description) {
        if (!description) return '';

        // Convert HTML to text
        const plainText = convert(description, {
            wordwrap: false,
            ignoreHref: true,
            ignoreImage: true,
            preserveNewlines: true
        });

        // Clean up extra whitespace
        return plainText.replace(/\s+/g, ' ').trim();
    }

    parseDate(dateString) {
        if (!dateString) return null;

        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? null : date.toISOString();
        } catch (error) {
            logger.warn(`Failed to parse date: ${dateString}`);
            return null;
        }
    }

    async fetchAllJobs() {
        const endpoints = JobApiService.getApiEndpoints();
        const allJobs = [];
        const errors = [];

        logger.info(`🚀 Starting to fetch jobs from ${endpoints.length} endpoints`);

        for (const endpoint of endpoints) {
            try {
                const jobs = await this.fetchJobsFromApi(endpoint);
                allJobs.push(...jobs);
                logger.info(`✅ Successfully fetched ${jobs.length} jobs from ${endpoint.name}`);
            } catch (error) {
                errors.push({
                    endpoint: endpoint.name,
                    error: error.message
                });
                logger.error(`❌ Failed to fetch jobs from ${endpoint.name}: ${error.message}`);
            }
        }

        logger.info(`📊 Total jobs fetched: ${allJobs.length}`);

        if (errors.length > 0) {
            logger.warn(`⚠️ Encountered ${errors.length} errors while fetching jobs:`, errors);
        }

        return {
            jobs: allJobs,
            totalJobs: allJobs.length,
            successfulEndpoints: endpoints.length - errors.length,
            failedEndpoints: errors.length,
            errors: errors,
            fetchedAt: new Date().toISOString()
        };
    }

    async fetchJobsByCategory(category) {
        const endpoints = JobApiService.getApiEndpoints()
            .filter(endpoint =>
                endpoint.description.toLowerCase().includes(category.toLowerCase()) ||
                endpoint.url.includes(category.toLowerCase())
            );

        if (endpoints.length === 0) {
            logger.warn(`No endpoints found for category: ${category}`);
            return { jobs: [], totalJobs: 0, errors: [] };
        }

        const allJobs = [];
        const errors = [];

        for (const endpoint of endpoints) {
            try {
                const jobs = await this.fetchJobsFromApi(endpoint);
                allJobs.push(...jobs);
            } catch (error) {
                errors.push({
                    endpoint: endpoint.name,
                    error: error.message
                });
            }
        }

        return {
            jobs: allJobs,
            totalJobs: allJobs.length,
            category: category,
            errors: errors,
            fetchedAt: new Date().toISOString()
        };
    }

    async fetchJobsBySource(source) {
        const endpoints = JobApiService.getApiEndpoints()
            .filter(endpoint => endpoint.source === source);

        if (endpoints.length === 0) {
            logger.warn(`No endpoints found for source: ${source}`);
            return { jobs: [], totalJobs: 0, errors: [] };
        }

        const allJobs = [];
        const errors = [];

        for (const endpoint of endpoints) {
            try {
                const jobs = await this.fetchJobsFromApi(endpoint);
                allJobs.push(...jobs);
            } catch (error) {
                errors.push({
                    endpoint: endpoint.name,
                    error: error.message
                });
            }
        }

        return {
            jobs: allJobs,
            totalJobs: allJobs.length,
            source: source,
            errors: errors,
            fetchedAt: new Date().toISOString()
        };
    }

    getAvailableCategories() {
        const endpoints = JobApiService.getApiEndpoints();
        const categories = new Set();

        endpoints.forEach(endpoint => {
            const url = endpoint.url;
            const match = url.match(/job_categories=([^&]+)/);
            if (match) {
                categories.add(match[1]);
            }
        });

        return Array.from(categories);
    }

    getAvailableSources() {
        const endpoints = JobApiService.getApiEndpoints();
        const sources = new Set();

        endpoints.forEach(endpoint => {
            sources.add(endpoint.source);
        });

        return Array.from(sources);
    }
}

module.exports = JobApiService;