AddEventHandler('MDT:Server:RegisterCallbacks', function()
    Callbacks:RegisterServerCallback('MDT:GetAllBusinesses', function(source, data, cb)
        print("^3[Business Manager]^7 GetAllBusinesses called by source: " .. tostring(source))
        
        local char = Fetch:Source(source):GetData('Character')
        if not char then
            print("^1[Business Manager]^7 Character not found for source: " .. tostring(source))
            cb(false)
            return
        end

        local hasPermission = Jobs.Permissions:HasPermissionInJob(source, 'government', 'MDT_BUSINESS_MANAGER')
        if not hasPermission then
            print("^1[Business Manager]^7 No permission for source: " .. tostring(source))
            cb(false)
            return
        end

        print("^2[Business Manager]^7 Permission granted, fetching businesses...")

        -- Get all Company type jobs from the Jobs cache/database
        local allJobs = Jobs:GetAll()
        if not allJobs then
            print("^1[Business Manager]^7 Jobs:GetAll() returned nil!")
            cb({})
            return
        end

        local businesses = {}
        local totalJobs = 0
        local companyJobs = 0
        
        for jobId, jobData in pairs(allJobs) do
            totalJobs = totalJobs + 1
            -- Only include Company type jobs (businesses/restaurants)
            if jobData.Type == 'Company' then
                companyJobs = companyJobs + 1
                
                -- Count employees for this job
                local employees = Jobs.Employees:GetAll(jobId)
                local employeeCount = employees and #employees or 0
                
                -- Determine business type (restaurant vs other business)
                local bizType = 'business'
                local jobName = jobData.Name or jobId
                local jobIdLower = jobId:lower()
                
                -- Check if it's a restaurant based on name or ID
                if jobIdLower:find('restaurant') or jobIdLower:find('cafe') or 
                   jobIdLower:find('burger') or jobIdLower:find('pizz') or 
                   jobIdLower:find('uwu') or jobIdLower:find('taco') or
                   jobIdLower:find('diner') or jobIdLower:find('food') then
                    bizType = 'restaurant'
                elseif jobIdLower:find('mechanic') or jobIdLower:find('auto') or 
                       jobIdLower:find('repair') or jobIdLower:find('garage') or
                       jobIdLower:find('tow') or jobIdLower:find('bennys') then
                    bizType = 'mechanic'
                end
                
                -- Get owner info
                local ownerData = nil
                if jobData.Owner then
                    ownerData = {
                        sid = jobData.Owner,
                        name = jobData.OwnerName or 'Unknown Owner'
                    }
                end
                
                table.insert(businesses, {
                    id = jobId,
                    name = jobName,
                    type = bizType,
                    owner = ownerData,
                    employees = employeeCount,
                    active = true, -- Could track based on recent activity
                })
                
                print(string.format("^2[Business Manager]^7 Added business: %s (Type: %s, Employees: %d)", jobName, bizType, employeeCount))
            end
        end
        
        print(string.format("^2[Business Manager]^7 Found %d total jobs, %d Company jobs, returning %d businesses", totalJobs, companyJobs, #businesses))
        cb(businesses)
    end)

    Callbacks:RegisterServerCallback('MDT:SellBusiness', function(source, data, cb)
        local char = Fetch:Source(source):GetData('Character')
        if not char then
            cb({ success = false, message = 'Character not found' })
            return
        end

        local hasPermission = Jobs.Permissions:HasPermissionInJob(source, 'government', 'MDT_BUSINESS_MANAGER')
        if not hasPermission then
            cb({ success = false, message = 'No permission' })
            return
        end

        local businessId = data.businessId
        local buyerSID = data.buyerSID
        local price = tonumber(data.price)

        if not businessId or not buyerSID or not price or price < 1 then
            cb({ success = false, message = 'Invalid data' })
            return
        end

        -- Get business info from Jobs cache
        local business = Jobs:Get(businessId)
        if not business or business.Type ~= 'Company' then
            cb({ success = false, message = 'Business not found or not a company' })
            return
        end

        -- Get buyer character
        local buyerChar = Fetch:SID(buyerSID)
        local buyerSource = buyerChar and buyerChar:GetData('Source')
        local buyerName = 'Unknown'
        
        if buyerChar then
            local buyerCharData = buyerChar:GetData('Character')
            if buyerCharData then
                buyerName = buyerCharData:GetData('First') .. ' ' .. buyerCharData:GetData('Last')
            end
        end

        -- Set the owner immediately (before payment)
        local success = Jobs.Management:Edit(businessId, {
            Owner = buyerSID,
            OwnerName = buyerName
        })

        if not success then
            cb({ success = false, message = 'Failed to set business owner' })
            return
        end

        -- Notify seller (governor)
        Execute:Client(source, 'Notification', 'Success', 
            string.format('Ownership of %s transferred to %s (SID: %s) for $%s', business.Name, buyerName, buyerSID, price), 
            'success')
        
        -- Notify buyer if online
        if buyerSource then
            Execute:Client(buyerSource, 'Notification', 'Success', 
                string.format('You are now the owner of %s! Purchase price: $%s', business.Name, price), 
                'success')
        end

        -- Log the transaction
        Logger:Trace('MDT', string.format('^2Business Sale^7: %s sold %s to SID %s (%s) for $%s', 
            char:GetData('First') .. ' ' .. char:GetData('Last'),
            business.Name,
            buyerSID,
            buyerName,
            price
        ))

        cb({ 
            success = true, 
            message = string.format('Business sold to %s for $%s', buyerName, price)
        })
    end)

    Callbacks:RegisterServerCallback('MDT:RevokeBusinessOwnership', function(source, data, cb)
        local char = Fetch:Source(source):GetData('Character')
        if not char then
            cb({ success = false, message = 'Character not found' })
            return
        end

        local hasPermission = Jobs.Permissions:HasPermissionInJob(source, 'government', 'MDT_BUSINESS_MANAGER')
        if not hasPermission then
            cb({ success = false, message = 'No permission' })
            return
        end

        local businessId = data.businessId
        if not businessId then
            cb({ success = false, message = 'Invalid business ID' })
            return
        end

        -- Get business info from Jobs cache
        local business = Jobs:Get(businessId)
        if not business or business.Type ~= 'Company' then
            cb({ success = false, message = 'Business not found or not a company' })
            return
        end

        if not business.Owner then
            cb({ success = false, message = 'Business has no owner to revoke' })
            return
        end

        local oldOwnerSID = business.Owner
        local oldOwnerName = business.OwnerName or 'Unknown'

        -- Revoke ownership using Jobs Management
        local success = Jobs.Management:Edit(businessId, {
            Owner = nil,
            OwnerName = nil
        })

        if success then
            -- Notify old owner if online
            local oldOwner = Fetch:SID(oldOwnerSID)
            if oldOwner then
                local oldOwnerSource = oldOwner:GetData('Source')
                if oldOwnerSource then
                    Execute:Client(oldOwnerSource, 'Notification', 'Warning', 
                        string.format('Your ownership of %s has been revoked by the Governor', business.Name), 
                        'error')
                end
            end

            -- Log the action
            Logger:Trace('MDT', string.format('^3Business Ownership Revoked^7: %s revoked ownership of %s from %s (SID: %s)', 
                char:GetData('First') .. ' ' .. char:GetData('Last'),
                business.Name,
                oldOwnerName,
                oldOwnerSID
            ))

            cb({ success = true, message = 'Ownership revoked successfully' })
        else
            cb({ success = false, message = 'Failed to revoke ownership' })
        end
    end)
end)
