-- Add status column to travel_posts for tracking completed rides
ALTER TABLE public.travel_posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create errand_requests table
CREATE TABLE public.errand_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    pickup_location text NOT NULL,
    delivery_location text NOT NULL,
    reward text,
    status text NOT NULL DEFAULT 'open',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone,
    completed_by uuid
);

-- Enable RLS on errand_requests
ALTER TABLE public.errand_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for errand_requests
CREATE POLICY "Users can view all errand requests"
    ON public.errand_requests FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own errand requests"
    ON public.errand_requests FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own errand requests"
    ON public.errand_requests FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own errand requests"
    ON public.errand_requests FOR DELETE
    USING (user_id = auth.uid());

-- Create carpool_rides table
CREATE TABLE public.carpool_rides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id uuid NOT NULL,
    from_location text NOT NULL,
    to_location text NOT NULL,
    departure_date date NOT NULL,
    departure_time time NOT NULL,
    seats_available integer NOT NULL DEFAULT 1,
    seats_taken integer NOT NULL DEFAULT 0,
    price_per_seat numeric(10,2),
    notes text,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone
);

-- Enable RLS on carpool_rides
ALTER TABLE public.carpool_rides ENABLE ROW LEVEL SECURITY;

-- RLS policies for carpool_rides
CREATE POLICY "Users can view all carpool rides"
    ON public.carpool_rides FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own carpool rides"
    ON public.carpool_rides FOR INSERT
    WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Users can update their own carpool rides"
    ON public.carpool_rides FOR UPDATE
    USING (driver_id = auth.uid());

CREATE POLICY "Users can delete their own carpool rides"
    ON public.carpool_rides FOR DELETE
    USING (driver_id = auth.uid());

-- Create activity_logs table for comprehensive logging
CREATE TABLE public.activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    action_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view all logs, users can view their own
CREATE POLICY "Users can view their own activity logs"
    ON public.activity_logs FOR SELECT
    USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (true);