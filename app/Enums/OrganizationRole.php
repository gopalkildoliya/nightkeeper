<?php

namespace App\Enums;

enum OrganizationRole: string
{
    case Owner = 'owner';
    case Member = 'member';
}
