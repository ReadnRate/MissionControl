export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          capabilities: string[] | null
          id: string
          last_active: string | null
          model: string | null
          name: string
          role: string
          status: string | null
        }
        Insert: {
          capabilities?: string[] | null
          id?: string
          last_active?: string | null
          model?: string | null
          name: string
          role: string
          status?: string | null
        }
        Update: {
          capabilities?: string[] | null
          id?: string
          last_active?: string | null
          model?: string | null
          name?: string
          role?: string
          status?: string | null
        }
        Relationships: []
      }
      author_leads: {
        Row: {
          book_title: string | null
          created_at: string | null
          email: string
          first_name: string | null
          genre: string | null
          id: string
          last_name: string | null
          personalization_text: string | null
          status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          book_title?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          genre?: string | null
          id?: string
          last_name?: string | null
          personalization_text?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          book_title?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          genre?: string | null
          id?: string
          last_name?: string | null
          personalization_text?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      author_quotes: {
        Row: {
          added_by: string
          author: string
          author_id: string | null
          caption: string | null
          created_at: string
          heygen_video_id: string | null
          id: string
          language: string
          posted_at: string | null
          quote: string
          r2_video_key: string | null
          r2_video_url: string | null
          regeneration_count: number
          rejected_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_for: string | null
          scheduled_platforms: string[] | null
          script: string | null
          script_approved_at: string | null
          script_generated_at: string | null
          script_word_count: number | null
          source: string | null
          status: Database["public"]["Enums"]["quote_status"]
          theme: Database["public"]["Enums"]["quote_theme"]
          video_approved_at: string | null
          video_aspect_ratio: string
          video_generated_at: string | null
          video_max_duration_seconds: number
          zernio_post_ids: Json | null
        }
        Insert: {
          added_by?: string
          author: string
          author_id?: string | null
          caption?: string | null
          created_at?: string
          heygen_video_id?: string | null
          id?: string
          language?: string
          posted_at?: string | null
          quote: string
          r2_video_key?: string | null
          r2_video_url?: string | null
          regeneration_count?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          scheduled_platforms?: string[] | null
          script?: string | null
          script_approved_at?: string | null
          script_generated_at?: string | null
          script_word_count?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          theme: Database["public"]["Enums"]["quote_theme"]
          video_approved_at?: string | null
          video_aspect_ratio?: string
          video_generated_at?: string | null
          video_max_duration_seconds?: number
          zernio_post_ids?: Json | null
        }
        Update: {
          added_by?: string
          author?: string
          author_id?: string | null
          caption?: string | null
          created_at?: string
          heygen_video_id?: string | null
          id?: string
          language?: string
          posted_at?: string | null
          quote?: string
          r2_video_key?: string | null
          r2_video_url?: string | null
          regeneration_count?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          scheduled_platforms?: string[] | null
          script?: string | null
          script_approved_at?: string | null
          script_generated_at?: string | null
          script_word_count?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          theme?: Database["public"]["Enums"]["quote_theme"]
          video_approved_at?: string | null
          video_aspect_ratio?: string
          video_generated_at?: string | null
          video_max_duration_seconds?: number
          zernio_post_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "author_quotes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          active_period: string | null
          bio: string | null
          created_at: string | null
          enriched_at: string | null
          enriched_by: string | null
          genres: string[] | null
          hidden_story: string | null
          id: string
          intro_hook: string | null
          name: string
          self_pub_relevant: boolean | null
          self_pub_story: string | null
        }
        Insert: {
          active_period?: string | null
          bio?: string | null
          created_at?: string | null
          enriched_at?: string | null
          enriched_by?: string | null
          genres?: string[] | null
          hidden_story?: string | null
          id?: string
          intro_hook?: string | null
          name: string
          self_pub_relevant?: boolean | null
          self_pub_story?: string | null
        }
        Update: {
          active_period?: string | null
          bio?: string | null
          created_at?: string | null
          enriched_at?: string | null
          enriched_by?: string | null
          genres?: string[] | null
          hidden_story?: string | null
          id?: string
          intro_hook?: string | null
          name?: string
          self_pub_relevant?: boolean | null
          self_pub_story?: string | null
        }
        Relationships: []
      }
      blog_topic_queue: {
        Row: {
          angle: string | null
          brief: string | null
          competitor_urls: string[] | null
          consumed_at: string | null
          consumed_by_slug: string | null
          content_type: string | null
          created_at: string
          cta_target: string | null
          faq_seeds: Json | null
          id: string
          intel_ids: string[] | null
          internal_link_targets: Json | null
          keyword_difficulty: number | null
          primary_keyword: string | null
          priority: number
          reference_urls: string[] | null
          schema_type: string | null
          search_intent: string | null
          search_volume: number | null
          secondary_keywords: string[] | null
          source_agent: string | null
          status: string
          suggested_author: string | null
          suggested_category: string | null
          target_publish_date: string | null
          title_idea: string
          updated_at: string
          video_analysis_ids: string[] | null
          why_this_topic: string | null
        }
        Insert: {
          angle?: string | null
          brief?: string | null
          competitor_urls?: string[] | null
          consumed_at?: string | null
          consumed_by_slug?: string | null
          content_type?: string | null
          created_at?: string
          cta_target?: string | null
          faq_seeds?: Json | null
          id?: string
          intel_ids?: string[] | null
          internal_link_targets?: Json | null
          keyword_difficulty?: number | null
          primary_keyword?: string | null
          priority?: number
          reference_urls?: string[] | null
          schema_type?: string | null
          search_intent?: string | null
          search_volume?: number | null
          secondary_keywords?: string[] | null
          source_agent?: string | null
          status?: string
          suggested_author?: string | null
          suggested_category?: string | null
          target_publish_date?: string | null
          title_idea: string
          updated_at?: string
          video_analysis_ids?: string[] | null
          why_this_topic?: string | null
        }
        Update: {
          angle?: string | null
          brief?: string | null
          competitor_urls?: string[] | null
          consumed_at?: string | null
          consumed_by_slug?: string | null
          content_type?: string | null
          created_at?: string
          cta_target?: string | null
          faq_seeds?: Json | null
          id?: string
          intel_ids?: string[] | null
          internal_link_targets?: Json | null
          keyword_difficulty?: number | null
          primary_keyword?: string | null
          priority?: number
          reference_urls?: string[] | null
          schema_type?: string | null
          search_intent?: string | null
          search_volume?: number | null
          secondary_keywords?: string[] | null
          source_agent?: string | null
          status?: string
          suggested_author?: string | null
          suggested_category?: string | null
          target_publish_date?: string | null
          title_idea?: string
          updated_at?: string
          video_analysis_ids?: string[] | null
          why_this_topic?: string | null
        }
        Relationships: []
      }
      decisions: {
        Row: {
          consulted_agents: string[] | null
          created_at: string | null
          date: string | null
          id: string
          question: string
          summary: string | null
        }
        Insert: {
          consulted_agents?: string[] | null
          created_at?: string | null
          date?: string | null
          id?: string
          question: string
          summary?: string | null
        }
        Update: {
          consulted_agents?: string[] | null
          created_at?: string | null
          date?: string | null
          id?: string
          question?: string
          summary?: string | null
        }
        Relationships: []
      }
      digg_posts: {
        Row: {
          channel_id: number
          content: string
          created_at: string
          id: string
          post_date: string
          status: string | null
          title: string
        }
        Insert: {
          channel_id: number
          content: string
          created_at?: string
          id?: string
          post_date: string
          status?: string | null
          title: string
        }
        Update: {
          channel_id?: number
          content?: string
          created_at?: string
          id?: string
          post_date?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      email_leads: {
        Row: {
          body_full: string | null
          body_preview: string | null
          classification: string | null
          created_at: string | null
          from_email: string | null
          gmail_id: string | null
          id: string
          source_email_id: string | null
          source_url: string | null
          status: string | null
          subject: string | null
          thread_id: string | null
          updated_at: string | null
          urls: Json | null
        }
        Insert: {
          body_full?: string | null
          body_preview?: string | null
          classification?: string | null
          created_at?: string | null
          from_email?: string | null
          gmail_id?: string | null
          id?: string
          source_email_id?: string | null
          source_url?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
          urls?: Json | null
        }
        Update: {
          body_full?: string | null
          body_preview?: string | null
          classification?: string | null
          created_at?: string | null
          from_email?: string | null
          gmail_id?: string | null
          id?: string
          source_email_id?: string | null
          source_url?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
          urls?: Json | null
        }
        Relationships: []
      }
      events: {
        Row: {
          agent: string | null
          content: string
          created_at: string | null
          id: string
          processed: boolean | null
        }
        Insert: {
          agent?: string | null
          content: string
          created_at?: string | null
          id?: string
          processed?: boolean | null
        }
        Update: {
          agent?: string | null
          content?: string
          created_at?: string | null
          id?: string
          processed?: boolean | null
        }
        Relationships: []
      }
      idea_comments: {
        Row: {
          author: string
          content: string
          created_at: string | null
          id: string
          idea_id: string | null
        }
        Insert: {
          author: string
          content: string
          created_at?: string | null
          id?: string
          idea_id?: string | null
        }
        Update: {
          author?: string
          content?: string
          created_at?: string | null
          id?: string
          idea_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_comments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          project: string | null
          status: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          project?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          project?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      intel: {
        Row: {
          category: string | null
          created_at: string | null
          date: string | null
          id: string
          importance: string | null
          project: string | null
          source: string | null
          source_email_id: string | null
          source_url: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          importance?: string | null
          project?: string | null
          source?: string | null
          source_email_id?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          importance?: string | null
          project?: string | null
          source?: string | null
          source_email_id?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      intels: {
        Row: {
          created_at: string | null
          id: string
          project: string | null
          source_email_id: string | null
          source_url: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project?: string | null
          source_email_id?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project?: string | null
          source_email_id?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          id: string
          recipient: string | null
          sender: string
          timestamp: string | null
        }
        Insert: {
          content: string
          id?: string
          recipient?: string | null
          sender: string
          timestamp?: string | null
        }
        Update: {
          content?: string
          id?: string
          recipient?: string | null
          sender?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      navigation_items: {
        Row: {
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          order: number | null
          path: string
        }
        Insert: {
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          order?: number | null
          path: string
        }
        Update: {
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          order?: number | null
          path?: string
        }
        Relationships: []
      }
      orchestrator_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          status?: string | null
        }
        Relationships: []
      }
      outreach_log: {
        Row: {
          author_lead_id: string | null
          email_sent_to: string
          error_message: string | null
          id: string
          resend_message_id: string | null
          sent_at: string | null
          status: string | null
          template_id: string
        }
        Insert: {
          author_lead_id?: string | null
          email_sent_to: string
          error_message?: string | null
          id?: string
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_id: string
        }
        Update: {
          author_lead_id?: string | null
          email_sent_to?: string
          error_message?: string | null
          id?: string
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_log_author_lead_id_fkey"
            columns: ["author_lead_id"]
            isOneToOne: true
            referencedRelation: "author_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_publications: {
        Row: {
          caption: string | null
          created_at: string
          error_message: string | null
          id: string
          platform: Database["public"]["Enums"]["publication_platform"]
          platform_post_url: string | null
          published_at: string | null
          quote_id: string
          retry_count: number
          scheduled_for: string
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
          zernio_post_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform: Database["public"]["Enums"]["publication_platform"]
          platform_post_url?: string | null
          published_at?: string | null
          quote_id: string
          retry_count?: number
          scheduled_for: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
          zernio_post_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["publication_platform"]
          platform_post_url?: string | null
          published_at?: string | null
          quote_id?: string
          retry_count?: number
          scheduled_for?: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
          zernio_post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_publications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "author_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_publications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes_to_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_publications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes_with_author_context"
            referencedColumns: ["quote_id"]
          },
          {
            foreignKeyName: "reel_publications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_publications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "scripts_to_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_publications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "videos_to_review"
            referencedColumns: ["id"]
          },
        ]
      }
      scrapio_cities: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          keywords_completed: string[] | null
          population: number | null
          run_at: string | null
          state: string | null
          status: string | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string | null
          id?: string
          keywords_completed?: string[] | null
          population?: number | null
          run_at?: string | null
          state?: string | null
          status?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          keywords_completed?: string[] | null
          population?: number | null
          run_at?: string | null
          state?: string | null
          status?: string | null
        }
        Relationships: []
      }
      scrapio_runs: {
        Row: {
          city: string | null
          country: string | null
          export_id: string | null
          id: string
          keyword: string | null
          leads_found: number | null
          leads_inserted: number | null
          run_at: string | null
          state: string | null
          status: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          export_id?: string | null
          id?: string
          keyword?: string | null
          leads_found?: number | null
          leads_inserted?: number | null
          run_at?: string | null
          state?: string | null
          status?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          export_id?: string | null
          id?: string
          keyword?: string | null
          leads_found?: number | null
          leads_inserted?: number | null
          run_at?: string | null
          state?: string | null
          status?: string | null
        }
        Relationships: []
      }
      system_prompts: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          key: string
          max_tokens: number
          model: string
          prompt: string
          temperature: number
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key: string
          max_tokens?: number
          model?: string
          prompt: string
          temperature?: number
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          max_tokens?: number
          model?: string
          prompt?: string
          temperature?: number
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          project: string | null
          source_email_id: string | null
          source_idea_id: string | null
          source_url: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          project?: string | null
          source_email_id?: string | null
          source_idea_id?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          project?: string | null
          source_email_id?: string | null
          source_idea_id?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trym_leads: {
        Row: {
          address: string | null
          all_contact_pages: string | null
          all_emails: string | null
          all_facebook_links: string | null
          all_instagram_links: string | null
          all_linkedin_links: string | null
          all_photos: string | null
          all_twitter_links: string | null
          all_types: string | null
          all_youtube_links: string | null
          booking_links: string | null
          borough: string | null
          business_name: string | null
          business_reported_price_range: string | null
          characteristics: string | null
          cid: string | null
          city: string | null
          color_hex: string | null
          contact_page_1: string | null
          contact_page_2: string | null
          contact_page_3: string | null
          contact_page_4: string | null
          contact_page_5: string | null
          country: string | null
          created_at: string | null
          customers_reported_detailed_price_range: string | null
          customers_reported_price_range: string | null
          description_1: string | null
          description_2: string | null
          description_3: string | null
          email: string | null
          email_2: string | null
          email_3: string | null
          email_4: string | null
          email_5: string | null
          facebook: string | null
          first_seen_on: string | null
          google_business_url: string | null
          google_id: string | null
          hero_image_url: string | null
          hotel_info: string | null
          id: string
          instagram: string | null
          is_claimed: boolean | null
          is_closed: boolean | null
          is_closed_temporarily: boolean | null
          keyword: string | null
          latitude: number | null
          level_1_division: string | null
          level_2_division: string | null
          link: string | null
          linkedin: string | null
          logo_url: string | null
          longitude: number | null
          main_type: string | null
          menu_photos: string | null
          mid: string | null
          occupancy: string | null
          offerings_link: string | null
          order_links: string | null
          other_places: string | null
          phone: string | null
          phone_intl: string | null
          photo_1: string | null
          photo_2: string | null
          photos: string[] | null
          photos_360: string | null
          photos_count: number | null
          place_id: string | null
          postal_code: string | null
          price_range: string | null
          price_range_currency: string | null
          reviews: Json | null
          reviews_count: number | null
          reviews_id: string | null
          reviews_per_score: string | null
          reviews_rating: number | null
          reviews_tags: string | null
          services: Json | null
          source: string | null
          state: string | null
          status: string | null
          street_1: string | null
          street_2: string | null
          timezone: string | null
          twitter: string | null
          website: string | null
          website_ad_pixels: string | null
          website_lang: string | null
          website_meta_description: string | null
          website_meta_generator: string | null
          website_meta_image: string | null
          website_meta_keywords: string | null
          website_root_url: string | null
          website_technologies: string | null
          website_title: string | null
          working_hours: string | null
          youtube: string | null
        }
        Insert: {
          address?: string | null
          all_contact_pages?: string | null
          all_emails?: string | null
          all_facebook_links?: string | null
          all_instagram_links?: string | null
          all_linkedin_links?: string | null
          all_photos?: string | null
          all_twitter_links?: string | null
          all_types?: string | null
          all_youtube_links?: string | null
          booking_links?: string | null
          borough?: string | null
          business_name?: string | null
          business_reported_price_range?: string | null
          characteristics?: string | null
          cid?: string | null
          city?: string | null
          color_hex?: string | null
          contact_page_1?: string | null
          contact_page_2?: string | null
          contact_page_3?: string | null
          contact_page_4?: string | null
          contact_page_5?: string | null
          country?: string | null
          created_at?: string | null
          customers_reported_detailed_price_range?: string | null
          customers_reported_price_range?: string | null
          description_1?: string | null
          description_2?: string | null
          description_3?: string | null
          email?: string | null
          email_2?: string | null
          email_3?: string | null
          email_4?: string | null
          email_5?: string | null
          facebook?: string | null
          first_seen_on?: string | null
          google_business_url?: string | null
          google_id?: string | null
          hero_image_url?: string | null
          hotel_info?: string | null
          id?: string
          instagram?: string | null
          is_claimed?: boolean | null
          is_closed?: boolean | null
          is_closed_temporarily?: boolean | null
          keyword?: string | null
          latitude?: number | null
          level_1_division?: string | null
          level_2_division?: string | null
          link?: string | null
          linkedin?: string | null
          logo_url?: string | null
          longitude?: number | null
          main_type?: string | null
          menu_photos?: string | null
          mid?: string | null
          occupancy?: string | null
          offerings_link?: string | null
          order_links?: string | null
          other_places?: string | null
          phone?: string | null
          phone_intl?: string | null
          photo_1?: string | null
          photo_2?: string | null
          photos?: string[] | null
          photos_360?: string | null
          photos_count?: number | null
          place_id?: string | null
          postal_code?: string | null
          price_range?: string | null
          price_range_currency?: string | null
          reviews?: Json | null
          reviews_count?: number | null
          reviews_id?: string | null
          reviews_per_score?: string | null
          reviews_rating?: number | null
          reviews_tags?: string | null
          services?: Json | null
          source?: string | null
          state?: string | null
          status?: string | null
          street_1?: string | null
          street_2?: string | null
          timezone?: string | null
          twitter?: string | null
          website?: string | null
          website_ad_pixels?: string | null
          website_lang?: string | null
          website_meta_description?: string | null
          website_meta_generator?: string | null
          website_meta_image?: string | null
          website_meta_keywords?: string | null
          website_root_url?: string | null
          website_technologies?: string | null
          website_title?: string | null
          working_hours?: string | null
          youtube?: string | null
        }
        Update: {
          address?: string | null
          all_contact_pages?: string | null
          all_emails?: string | null
          all_facebook_links?: string | null
          all_instagram_links?: string | null
          all_linkedin_links?: string | null
          all_photos?: string | null
          all_twitter_links?: string | null
          all_types?: string | null
          all_youtube_links?: string | null
          booking_links?: string | null
          borough?: string | null
          business_name?: string | null
          business_reported_price_range?: string | null
          characteristics?: string | null
          cid?: string | null
          city?: string | null
          color_hex?: string | null
          contact_page_1?: string | null
          contact_page_2?: string | null
          contact_page_3?: string | null
          contact_page_4?: string | null
          contact_page_5?: string | null
          country?: string | null
          created_at?: string | null
          customers_reported_detailed_price_range?: string | null
          customers_reported_price_range?: string | null
          description_1?: string | null
          description_2?: string | null
          description_3?: string | null
          email?: string | null
          email_2?: string | null
          email_3?: string | null
          email_4?: string | null
          email_5?: string | null
          facebook?: string | null
          first_seen_on?: string | null
          google_business_url?: string | null
          google_id?: string | null
          hero_image_url?: string | null
          hotel_info?: string | null
          id?: string
          instagram?: string | null
          is_claimed?: boolean | null
          is_closed?: boolean | null
          is_closed_temporarily?: boolean | null
          keyword?: string | null
          latitude?: number | null
          level_1_division?: string | null
          level_2_division?: string | null
          link?: string | null
          linkedin?: string | null
          logo_url?: string | null
          longitude?: number | null
          main_type?: string | null
          menu_photos?: string | null
          mid?: string | null
          occupancy?: string | null
          offerings_link?: string | null
          order_links?: string | null
          other_places?: string | null
          phone?: string | null
          phone_intl?: string | null
          photo_1?: string | null
          photo_2?: string | null
          photos?: string[] | null
          photos_360?: string | null
          photos_count?: number | null
          place_id?: string | null
          postal_code?: string | null
          price_range?: string | null
          price_range_currency?: string | null
          reviews?: Json | null
          reviews_count?: number | null
          reviews_id?: string | null
          reviews_per_score?: string | null
          reviews_rating?: number | null
          reviews_tags?: string | null
          services?: Json | null
          source?: string | null
          state?: string | null
          status?: string | null
          street_1?: string | null
          street_2?: string | null
          timezone?: string | null
          twitter?: string | null
          website?: string | null
          website_ad_pixels?: string | null
          website_lang?: string | null
          website_meta_description?: string | null
          website_meta_generator?: string | null
          website_meta_image?: string | null
          website_meta_keywords?: string | null
          website_root_url?: string | null
          website_technologies?: string | null
          website_title?: string | null
          working_hours?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      video_analyses: {
        Row: {
          channel: string | null
          created_at: string | null
          detailed_summary: string | null
          id: string
          key_points: Json | null
          project: string | null
          short_summary: string | null
          thumbnail_url: string | null
          title: string | null
          video_id: string | null
          youtube_url: string
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          detailed_summary?: string | null
          id?: string
          key_points?: Json | null
          project?: string | null
          short_summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
          video_id?: string | null
          youtube_url: string
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          detailed_summary?: string | null
          id?: string
          key_points?: Json | null
          project?: string | null
          short_summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
          video_id?: string | null
          youtube_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      quotes_stock_summary: {
        Row: {
          already_posted: number | null
          pending_review: number | null
          ready_to_use: number | null
          rejected: number | null
          scheduled: number | null
          script_pending: number | null
          theme: Database["public"]["Enums"]["quote_theme"] | null
          video_pending: number | null
        }
        Relationships: []
      }
      quotes_to_review: {
        Row: {
          author: string | null
          created_at: string | null
          id: string | null
          quote: string | null
          source: string | null
          theme: Database["public"]["Enums"]["quote_theme"] | null
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          id?: string | null
          quote?: string | null
          source?: string | null
          theme?: Database["public"]["Enums"]["quote_theme"] | null
        }
        Update: {
          author?: string | null
          created_at?: string | null
          id?: string | null
          quote?: string | null
          source?: string | null
          theme?: Database["public"]["Enums"]["quote_theme"] | null
        }
        Relationships: []
      }
      quotes_with_author_context: {
        Row: {
          author: string | null
          bio: string | null
          genres: string[] | null
          hidden_story: string | null
          intro_hook: string | null
          quote: string | null
          quote_id: string | null
          self_pub_relevant: boolean | null
          self_pub_story: string | null
          source: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          theme: Database["public"]["Enums"]["quote_theme"] | null
        }
        Relationships: []
      }
      scheduled_reels: {
        Row: {
          author: string | null
          caption: string | null
          id: string | null
          quote: string | null
          r2_video_url: string | null
          scheduled_for: string | null
          scheduled_platforms: string[] | null
          theme: Database["public"]["Enums"]["quote_theme"] | null
        }
        Insert: {
          author?: string | null
          caption?: string | null
          id?: string | null
          quote?: string | null
          r2_video_url?: string | null
          scheduled_for?: string | null
          scheduled_platforms?: string[] | null
          theme?: Database["public"]["Enums"]["quote_theme"] | null
        }
        Update: {
          author?: string | null
          caption?: string | null
          id?: string | null
          quote?: string | null
          r2_video_url?: string | null
          scheduled_for?: string | null
          scheduled_platforms?: string[] | null
          theme?: Database["public"]["Enums"]["quote_theme"] | null
        }
        Relationships: []
      }
      scripts_to_review: {
        Row: {
          author: string | null
          id: string | null
          length_check: string | null
          quote: string | null
          script: string | null
          script_generated_at: string | null
          script_word_count: number | null
          theme: Database["public"]["Enums"]["quote_theme"] | null
        }
        Insert: {
          author?: string | null
          id?: string | null
          length_check?: never
          quote?: string | null
          script?: string | null
          script_generated_at?: string | null
          script_word_count?: number | null
          theme?: Database["public"]["Enums"]["quote_theme"] | null
        }
        Update: {
          author?: string | null
          id?: string | null
          length_check?: never
          quote?: string | null
          script?: string | null
          script_generated_at?: string | null
          script_word_count?: number | null
          theme?: Database["public"]["Enums"]["quote_theme"] | null
        }
        Relationships: []
      }
      videos_to_review: {
        Row: {
          author: string | null
          id: string | null
          quote: string | null
          r2_video_url: string | null
          script: string | null
          theme: Database["public"]["Enums"]["quote_theme"] | null
          video_aspect_ratio: string | null
          video_generated_at: string | null
          video_max_duration_seconds: number | null
        }
        Insert: {
          author?: string | null
          id?: string | null
          quote?: string | null
          r2_video_url?: string | null
          script?: string | null
          theme?: Database["public"]["Enums"]["quote_theme"] | null
          video_aspect_ratio?: string | null
          video_generated_at?: string | null
          video_max_duration_seconds?: number | null
        }
        Update: {
          author?: string | null
          id?: string | null
          quote?: string | null
          r2_video_url?: string | null
          script?: string | null
          theme?: Database["public"]["Enums"]["quote_theme"] | null
          video_aspect_ratio?: string | null
          video_generated_at?: string | null
          video_max_duration_seconds?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_public_url_for_quote: {
        Args: { quote_id: string }
        Returns: string
      }
      generate_r2_key_for_quote: { Args: { quote_id: string }; Returns: string }
    }
    Enums: {
      publication_platform:
        | "instagram"
        | "facebook"
        | "tiktok"
        | "pinterest"
        | "linkedin"
      publication_status: "pending" | "posting" | "published" | "failed"
      quote_status:
        | "pending_review"
        | "approved"
        | "posted"
        | "rejected"
        | "script_pending"
        | "script_approved"
        | "video_pending"
        | "video_approved"
        | "scheduled"
      quote_theme:
        | "perseverance"
        | "craft"
        | "rejection"
        | "creativity"
        | "discipline"
        | "doubt"
        | "success"
        | "process"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      publication_platform: [
        "instagram",
        "facebook",
        "tiktok",
        "pinterest",
        "linkedin",
      ],
      publication_status: ["pending", "posting", "published", "failed"],
      quote_status: [
        "pending_review",
        "approved",
        "posted",
        "rejected",
        "script_pending",
        "script_approved",
        "video_pending",
        "video_approved",
        "scheduled",
      ],
      quote_theme: [
        "perseverance",
        "craft",
        "rejection",
        "creativity",
        "discipline",
        "doubt",
        "success",
        "process",
      ],
    },
  },
} as const

