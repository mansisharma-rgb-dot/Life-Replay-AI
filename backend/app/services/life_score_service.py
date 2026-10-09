class LifeScoreService:
    @staticmethod
    def calculate(activities, mood, wellbeing):
        score = 0
        breakdown = {}

        # 1. Sleep (Max 15)
        # Optimal sleep is ~7.5 - 9 hours
        sleep_hours = activities.get('sleep_hours', 0)
        sleep_score = 0
        if 7 <= sleep_hours <= 9:
            sleep_score = 15
        elif 6 <= sleep_hours < 7 or 9 < sleep_hours <= 10:
            sleep_score = 10
        elif 5 <= sleep_hours < 6:
            sleep_score = 5
        score += sleep_score
        breakdown['sleep'] = sleep_score

        # 2. Productivity (Max 25)
        # Combination of study and work
        prod_hours = activities.get('study_hours', 0) + activities.get('work_hours', 0)
        prod_score = min(25, int((prod_hours / 8.0) * 25)) if prod_hours > 0 else 0
        score += prod_score
        breakdown['productivity'] = prod_score

        # 3. Mindfulness (Max 15)
        # Meditation or reading
        mindful_mins = activities.get('meditation_minutes', 0) + activities.get('reading_minutes', 0)
        mindful_score = min(15, int((mindful_mins / 30.0) * 15)) if mindful_mins > 0 else 0
        score += mindful_score
        breakdown['mindfulness'] = mindful_score

        # 4. Exercise (Max 15)
        exercise_mins = activities.get('exercise_minutes', 0)
        exercise_score = min(15, int((exercise_mins / 45.0) * 15)) if exercise_mins > 0 else 0
        score += exercise_score
        breakdown['exercise'] = exercise_score

        # 5. Mood (Max 10)
        # Mood is 1-10 scale
        mood_val = mood.get('mood_score', 5)
        mood_score = int((mood_val / 10.0) * 10)
        score += mood_score
        breakdown['mood'] = mood_score

        # 6. Wellbeing (Max 20)
        # Energy, stress, focus, motivation (each 1-5). Max is 20 total.
        # Stress is reversed (lower stress is better), let's assume higher stress_level means more stressed.
        # Wait, usually higher is better in rating scales unless specified. Let's assume they are all positive attributes or we handle stress as (6 - stress).
        energy = wellbeing.get('energy_level', 3)
        stress = wellbeing.get('stress_level', 3)
        focus = wellbeing.get('focus_level', 3)
        motivation = wellbeing.get('motivation_level', 3)
        
        # In typical apps, "stress level 5" means highly stressed. Let's invert it: 6 - stress.
        wellbeing_val = energy + (6 - stress) + focus + motivation
        # Max is 5+5+5+5 = 20.
        wellbeing_score = min(20, wellbeing_val)
        score += wellbeing_score
        breakdown['wellbeing'] = wellbeing_score

        # 7. Penalties
        screen_time = activities.get('screen_time_minutes', 0)
        if screen_time > 240: # > 4 hours
            penalty = min(20, int((screen_time - 240) / 60) * 5)
            score -= penalty
            breakdown['screen_time_penalty'] = -penalty

        final_score = max(0, min(100, score))
        return final_score, breakdown
