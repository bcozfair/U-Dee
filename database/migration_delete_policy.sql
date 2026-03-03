-- Allow users to delete their own location history
CREATE POLICY "Users can delete their own location history"
ON public.location_history
FOR DELETE
USING (auth.uid() = user_id);
